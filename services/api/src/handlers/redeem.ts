import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { validateRedeemRequest } from '../domain/validate.js';
import { redeem } from '../domain/redeem.js';
import { DynamoRedeemRepository } from '../repository/dynamo.js';
import { computeCardIndex, lastFour } from '../crypto/hmac.js';
import { decryptField } from '../crypto/kms.js';
import { getHmacKey } from '../crypto/secret.js';
import { newRedemptionId, hashIp } from '../lib/id.js';
import { ok, fromError } from '../lib/http.js';
import { withRateLimit } from '../middleware/rate-limit.js';
import { writeAudit } from '../audit/audit.js';
import { log } from '../lib/logger.js';

const repo = new DynamoRedeemRepository();
const IP_SALT = process.env.IP_SALT ?? 'card-platform';

// POST /api/v1/redemptions —— 协议适配层（lambda.md：handler 只做适配）
export async function handler(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyStructuredResultV2> {
  const correlationId = event.requestContext?.requestId ?? 'local';
  const ip = event.requestContext?.http?.sourceIp ?? '0.0.0.0';

  // SEC-005：限流（连续失败递增等待 / 超频 429）
  const limited = await withRateLimit(ip);
  if (limited) {
    log.warn({ correlationId, event: 'rate_limited' });
    return limited;
  }

  let input;
  try {
    input = validateRedeemRequest(parseBody(event.body));
  } catch (e) {
    return fromError(e);
  }

  try {
    const key = await getHmacKey();
    const cardHmac = computeCardIndex(input.code, key);
    const now = Date.now();

    const result = await redeem(
      { requestId: input.requestId },
      {
        repo,
        cardHmac,
        cardLast4: lastFour(input.code),
        decryptPayload: decryptField,
        newRedemptionId: () => newRedemptionId(now),
        ipHash: hashIp(ip, IP_SALT),
        now,
      },
    );

    // FR-301：审计（脱敏，末四位/摘要，绝不记交付明文 SEC-007）
    await writeAudit({
      redemptionId: result.redemption_id,
      action: 'redeem_success',
      cardHmac,
      ipHash: hashIp(ip, IP_SALT),
      now,
    });
    log.info({ correlationId, event: 'redeem_result', result_code: 'REDEEMED', redemptionId: result.redemption_id });
    return ok(result);
  } catch (e) {
    const res = fromError(e);
    log.info({ correlationId, event: 'redeem_result', result_code: JSON.parse(res.body).error_code });
    return res;
  }
}

function parseBody(body: string | undefined): unknown {
  if (!body) return null;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}
