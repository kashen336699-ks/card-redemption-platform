import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { DynamoRedeemRepository } from '../repository/dynamo.js';
import { reconstructSuccess } from '../domain/redeem.js';
import { decryptField } from '../crypto/kms.js';
import { ok, errorResponse } from '../lib/http.js';

const repo = new DynamoRedeemRepository();

// GET /api/v1/redemptions/{id} —— 处理中轮询 / 终态查询（FR-010）
export async function handler(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyStructuredResultV2> {
  const id = event.pathParameters?.id;
  if (!id) return errorResponse('VALIDATION_ERROR');

  // MVP：兑换同步完成，记录存在即返回已兑换结果；不存在返回 404。
  // 幂等记录仅存密文，按需解密重建对外响应（SEC-006）。
  const stored = await repo.getRedemptionById(id);
  if (!stored) return errorResponse('NOT_FOUND');
  const success = await reconstructSuccess(stored, decryptField);
  return ok(success);
}
