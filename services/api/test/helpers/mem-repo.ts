import type { RedeemSuccess } from '@card/contracts';
import {
  ConditionalFailure,
  type RedeemRepository,
  type CardRecord,
  type ProductRecord,
  type InventoryRecord,
  type StoredResult,
  type CommitInput,
} from '../../src/domain/types.js';
import { buildDelivery, toProductView } from '../../src/domain/redeem.js';

// 内存版 repository，模拟 DynamoDB 的原子条件写语义：
// commitRedemption 的「读卡密状态 → 校验 AVAILABLE → 置 REDEEMED」在一个同步临界区完成，
// 不在中间 await，等价于 DynamoDB TransactWriteItems + ConditionExpression 的原子性。
// 用于验证 SEC-002（并发只成功一次）/ FR-302（幂等）/ NFR-003（回滚可恢复）。
export class MemRepo implements RedeemRepository {
  cards = new Map<string, CardRecord>();
  products = new Map<string, ProductRecord>();
  inventory = new Map<string, InventoryRecord[]>();
  idempotency = new Map<string, StoredResult>();
  redemptions: { id: string; cardHmac: string; invId: string }[] = [];
  // 注入延迟以制造交错（模拟并发）
  delayMs = 0;

  private async tick() {
    if (this.delayMs) await new Promise((r) => setTimeout(r, this.delayMs));
  }

  async getIdempotent(requestId: string): Promise<StoredResult | null> {
    await this.tick();
    return this.idempotency.get(requestId) ?? null;
  }
  async getCardByIndex(cardHmac: string): Promise<CardRecord | null> {
    await this.tick();
    return this.cards.get(cardHmac) ?? null;
  }
  async getProduct(sku: string): Promise<ProductRecord | null> {
    await this.tick();
    return this.products.get(sku) ?? null;
  }
  async getAvailableInventory(sku: string): Promise<InventoryRecord | null> {
    await this.tick();
    return (this.inventory.get(sku) ?? []).find((i) => i.status === 'AVAILABLE') ?? null;
  }

  async commitRedemption(input: CommitInput): Promise<RedeemSuccess> {
    await this.tick();
    // —— 同步临界区（无 await）：模拟原子条件写 ——
    const card = this.cards.get(input.card.cardHmac);
    if (!card || card.status !== 'AVAILABLE') throw new ConditionalFailure();
    const inv = (this.inventory.get(input.product.sku) ?? []).find(
      (i) => i.invId === input.inventory.invId,
    );
    if (!inv || inv.status !== 'AVAILABLE') throw new ConditionalFailure();
    if (this.idempotency.has(input.requestId)) throw new ConditionalFailure();

    card.status = 'REDEEMED';
    inv.status = 'LOCKED';
    const redeemedAt = new Date(input.now).toISOString();
    const response: RedeemSuccess = {
      redemption_id: input.redemptionId,
      status: 'REDEEMED',
      product: toProductView(input.product),
      delivery: buildDelivery(input.product.deliveryType, input.deliveryPlaintext),
      redeemed_at: redeemedAt,
    };
    // 幂等记录只存密文（与生产一致，SEC-006）
    this.idempotency.set(input.requestId, {
      redemptionId: input.redemptionId,
      product: toProductView(input.product),
      deliveryType: input.product.deliveryType,
      deliveryCipher: inv.encryptedPayload,
      redeemedAt,
    });
    this.redemptions.push({
      id: input.redemptionId,
      cardHmac: card.cardHmac,
      invId: inv.invId,
    });
    return response;
  }
}

export function seedOneCard(repo: MemRepo, hmac = 'cardhmac0001', sku = 'SKU-1', stock = 3) {
  repo.cards.set(hmac, { cardHmac: hmac, productSku: sku, status: 'AVAILABLE', expiresAt: 0 });
  repo.products.set(sku, {
    sku,
    name: 'XX 会员季卡',
    spec: '90 天',
    deliveryType: 'code',
    status: 'ON',
  });
  repo.inventory.set(
    sku,
    Array.from({ length: stock }, (_, i) => ({
      invId: `inv-${i}`,
      productSku: sku,
      status: 'AVAILABLE' as const,
      encryptedPayload: `cipher-${i}`,
    })),
  );
}
