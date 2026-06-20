import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { log } from '../lib/logger.js';

// FR-301：审计日志。脱敏——只记 HMAC 摘要末四位、IP 哈希，绝不记完整卡密或交付明文（SEC-007）。
// D2：TTL 90 天。

const TABLE = process.env.TABLE_NAME ?? 'card-redemption';
const RETENTION_DAYS = 90;
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export interface AuditInput {
  redemptionId: string;
  action: string;
  cardHmac: string;
  ipHash: string;
  now: number;
  detail?: Record<string, string | number>;
}

export async function writeAudit(input: AuditInput): Promise<void> {
  const at = new Date(input.now).toISOString();
  try {
    await ddb.send(
      new PutCommand({
        TableName: TABLE,
        Item: {
          PK: `RDM#${input.redemptionId}`,
          SK: `LOG#${input.now}`,
          actorType: 'system',
          action: input.action,
          cardHmacLast4: input.cardHmac.slice(-4), // 仅摘要末四位（SEC-007）
          ipHash: input.ipHash,
          detail: input.detail ?? {},
          createdAt: at,
          ttl: Math.floor(input.now / 1000) + RETENTION_DAYS * 86400,
        },
      }),
    );
  } catch {
    // 审计失败不阻断主流程，但要可观测
    log.error({ event: 'audit_write_failed', redemptionId: input.redemptionId });
  }
}
