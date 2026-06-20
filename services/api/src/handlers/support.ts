import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import type { SupportLookupResult } from '@card/contracts';
import { validateSupportLookup } from '../domain/validate.js';
import { DynamoRedeemRepository } from '../repository/dynamo.js';
import { ok, errorResponse, fromError } from '../lib/http.js';

const repo = new DynamoRedeemRepository();

// POST /api/v1/support/lookup —— 售后脱敏查询（FR-207）
// 按 末四位 / 订单号 / 兑换编号 定位；返回脱敏卡密状态与日志摘要，绝不返回明文/交付内容。
export async function handler(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyStructuredResultV2> {
  let q;
  try {
    q = validateSupportLookup(parseBody(event.body));
  } catch (e) {
    return fromError(e);
  }

  const found = await repo.supportLookup(q);
  if (!found) return errorResponse('NOT_FOUND');

  const result: SupportLookupResult = {
    masked_code: found.maskedCode,
    status: found.status,
    product_name: found.productName,
    redeemed_at: found.redeemedAt ?? null,
    log_summary: found.logSummary,
  };
  return ok(result);
}

function parseBody(body: string | undefined): unknown {
  if (!body) return null;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}
