import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
  TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import type { RedeemSuccess } from '@card/contracts';
import {
  ConditionalFailure,
  type RedeemRepository,
  type CardRecord,
  type ProductRecord,
  type InventoryRecord,
  type StoredResult,
  type CommitInput,
} from '../domain/types.js';
import { buildDelivery, toProductView } from '../domain/redeem.js';

const RETENTION_DAYS = 90; // D2：审计/兑换记录保留 90 天（TTL）
const TABLE = process.env.TABLE_NAME ?? 'card-redemption';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

const ttlEpoch = (now: number) => Math.floor(now / 1000) + RETENTION_DAYS * 86400;

// 售后查询结果（脱敏）
export interface SupportRecord {
  maskedCode: string;
  status: CardRecord['status'];
  productName?: string;
  redeemedAt?: string;
  logSummary?: { action: string; at: string }[];
}

export class DynamoRedeemRepository implements RedeemRepository {
  async getIdempotent(requestId: string): Promise<StoredResult | null> {
    const out = await ddb.send(
      new GetCommand({ TableName: TABLE, Key: { PK: `IDEMP#${requestId}`, SK: 'META' } }),
    );
    if (!out.Item) return null;
    return toStoredResult(out.Item);
  }

  async getCardByIndex(cardHmac: string): Promise<CardRecord | null> {
    const out = await ddb.send(
      new GetCommand({ TableName: TABLE, Key: { PK: `CARD#${cardHmac}`, SK: 'META' } }),
    );
    if (!out.Item) return null;
    const i = out.Item;
    return {
      cardHmac,
      productSku: i.productSku,
      status: i.status,
      expiresAt: i.expiresAt ?? 0,
      orderRef: i.orderRef,
    };
  }

  async getProduct(sku: string): Promise<ProductRecord | null> {
    const out = await ddb.send(
      new GetCommand({ TableName: TABLE, Key: { PK: `PRODUCT#${sku}`, SK: 'META' } }),
    );
    if (!out.Item) return null;
    const i = out.Item;
    return { sku, name: i.name, spec: i.spec, deliveryType: i.deliveryType, status: i.status };
  }

  async getAvailableInventory(sku: string): Promise<InventoryRecord | null> {
    const out = await ddb.send(
      new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :inv)',
        FilterExpression: 'invStatus = :avail',
        ExpressionAttributeValues: {
          ':pk': `PRODUCT#${sku}`,
          ':inv': 'INV#',
          ':avail': 'AVAILABLE',
        },
        // 不用 Limit:1——DynamoDB Limit 在 Filter 之前生效，会漏掉可用项（F-103）。
        // 由 FilterExpression 服务端返回可用项，取第一条。
      }),
    );
    const item = out.Items?.[0];
    if (!item) return null;
    return {
      invId: item.invId,
      productSku: sku,
      status: 'AVAILABLE',
      encryptedPayload: item.encryptedPayload,
    };
  }

  async commitRedemption(input: CommitInput): Promise<RedeemSuccess> {
    const { card, product, inventory, requestId, redemptionId, ipHash, now, deliveryPlaintext } =
      input;
    const redeemedAt = new Date(now).toISOString();
    const response: RedeemSuccess = {
      redemption_id: redemptionId,
      status: 'REDEEMED',
      product: toProductView(product),
      delivery: buildDelivery(product.deliveryType, deliveryPlaintext),
      redeemed_at: redeemedAt,
    };

    try {
      await ddb.send(
        new TransactWriteCommand({
          TransactItems: [
            // 1) 卡密条件更新 AVAILABLE→REDEEMED（乐观锁，SEC-002 最终保障）
            {
              Update: {
                TableName: TABLE,
                Key: { PK: `CARD#${card.cardHmac}`, SK: 'META' },
                UpdateExpression: 'SET #s = :redeemed, redeemedAt = :ra, redemptionId = :rid',
                ConditionExpression: '#s = :available',
                ExpressionAttributeNames: { '#s': 'status' },
                ExpressionAttributeValues: {
                  ':redeemed': 'REDEEMED',
                  ':available': 'AVAILABLE',
                  ':ra': redeemedAt,
                  ':rid': redemptionId,
                },
              },
            },
            // 2) 库存锁定 AVAILABLE→LOCKED（条件）
            {
              Update: {
                TableName: TABLE,
                Key: { PK: `PRODUCT#${product.sku}`, SK: `INV#${inventory.invId}` },
                UpdateExpression: 'SET invStatus = :locked, assignedRedemptionId = :rid',
                ConditionExpression: 'invStatus = :avail',
                ExpressionAttributeValues: {
                  ':locked': 'LOCKED',
                  ':avail': 'AVAILABLE',
                  ':rid': redemptionId,
                },
              },
            },
            // 3) 兑换记录（不存在才写）+ TTL 90 天
            {
              Put: {
                TableName: TABLE,
                Item: {
                  PK: `RDM#${redemptionId}`,
                  SK: 'META',
                  requestId,
                  cardHmac: card.cardHmac,
                  productSku: product.sku,
                  inventoryId: inventory.invId,
                  result: 'REDEEMED',
                  ipHash,
                  orderRef: card.orderRef,
                  cardLast4: input.cardLast4,
                  GSI1PK: card.orderRef ? `ORDER#${card.orderRef}` : `CARD4#${input.cardLast4}`,
                  GSI1SK: redeemedAt,
                  createdAt: redeemedAt,
                  ttl: ttlEpoch(now),
                },
                ConditionExpression: 'attribute_not_exists(PK)',
              },
            },
            // 4) 幂等键（不存在才写；重复 request_id → 取消事务）FR-302。
            //    SEC-006：只存交付 KMS 密文，不存明文；重放时再解密。
            {
              Put: {
                TableName: TABLE,
                Item: {
                  PK: `IDEMP#${requestId}`,
                  SK: 'META',
                  redemptionId,
                  productView: response.product,
                  deliveryType: product.deliveryType,
                  deliveryCipher: inventory.encryptedPayload,
                  redeemedAt,
                  ttl: ttlEpoch(now),
                },
                ConditionExpression: 'attribute_not_exists(PK)',
              },
            },
          ],
        }),
      );
      return response;
    } catch (e: unknown) {
      // 条件失败（任一项）→ 整体回滚，domain 据此处理并发竞争
      if (isTransactionCanceled(e)) throw new ConditionalFailure();
      throw e;
    }
  }

  // —— 售后/查询（不在 RedeemRepository 端口内）——

  // 返回幂等记录（仅含密文）；交付内容由调用方（handler）按需解密（SEC-006）。
  async getRedemptionById(redemptionId: string): Promise<StoredResult | null> {
    const out = await ddb.send(
      new GetCommand({ TableName: TABLE, Key: { PK: `RDM#${redemptionId}`, SK: 'META' } }),
    );
    if (!out.Item) return null;
    const reqId = out.Item.requestId as string;
    const idem = await ddb.send(
      new GetCommand({ TableName: TABLE, Key: { PK: `IDEMP#${reqId}`, SK: 'META' } }),
    );
    return idem.Item ? toStoredResult(idem.Item) : null;
  }

  async supportLookup(q: {
    codeLast4?: string;
    orderRef?: string;
    redemptionId?: string;
  }): Promise<SupportRecord | null> {
    let item: Record<string, unknown> | undefined;
    if (q.redemptionId) {
      const out = await ddb.send(
        new GetCommand({ TableName: TABLE, Key: { PK: `RDM#${q.redemptionId}`, SK: 'META' } }),
      );
      item = out.Item;
    } else {
      const gsi1pk = q.orderRef ? `ORDER#${q.orderRef}` : `CARD4#${q.codeLast4}`;
      const out = await ddb.send(
        new QueryCommand({
          TableName: TABLE,
          IndexName: 'GSI1',
          KeyConditionExpression: 'GSI1PK = :pk',
          ExpressionAttributeValues: { ':pk': gsi1pk },
          Limit: 1,
          ScanIndexForward: false,
        }),
      );
      item = out.Items?.[0];
    }
    if (!item) return null;
    const last4 = String(item.cardLast4 ?? '').slice(-4);
    return {
      maskedCode: `****-****-****-${last4}`,
      status: 'REDEEMED',
      redeemedAt: item.createdAt as string,
      logSummary: [{ action: 'redeem_success', at: item.createdAt as string }],
    };
  }
}

function isTransactionCanceled(e: unknown): boolean {
  const name = (e as { name?: string })?.name ?? '';
  return name === 'TransactionCanceledException' || name === 'ConditionalCheckFailedException';
}

// 幂等记录 item → StoredResult（仅密文，无明文交付）
function toStoredResult(item: Record<string, unknown>): StoredResult {
  return {
    redemptionId: item.redemptionId as string,
    product: item.productView as StoredResult['product'],
    deliveryType: item.deliveryType as StoredResult['deliveryType'],
    deliveryCipher: item.deliveryCipher as string,
    redeemedAt: item.redeemedAt as string | undefined,
  };
}
