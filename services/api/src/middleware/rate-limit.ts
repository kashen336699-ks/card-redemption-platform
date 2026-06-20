import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { errorResponse, type HttpResponse } from '../lib/http.js';
import { decideRate, WINDOW_SEC } from './rate-decision.js';

// SEC-005：IP 限速 + 连续失败递增等待。决策逻辑在 rate-decision.ts（纯函数，可单测）；
// 此处用 DynamoDB 原子自增计数（窗口 TTL）。
const TABLE = process.env.TABLE_NAME ?? 'card-redemption';
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export { decideRate };

// 返回 429 响应表示被限流；返回 null 表示放行
export async function withRateLimit(ip: string): Promise<HttpResponse | null> {
  const now = Math.floor(Date.now() / 1000);
  const out = await ddb.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { PK: `RATE#${ip}`, SK: `W#${Math.floor(now / WINDOW_SEC)}` },
      UpdateExpression: 'ADD attempts :one SET #ttl = :ttl',
      ExpressionAttributeNames: { '#ttl': 'ttl' },
      ExpressionAttributeValues: { ':one': 1, ':ttl': now + WINDOW_SEC * 2 },
      ReturnValues: 'UPDATED_NEW',
    }),
  );
  const attempts = Number(out.Attributes?.attempts ?? 1);
  const decision = decideRate(attempts);
  if (decision.allowed) return null;
  return errorResponse('TOO_MANY_ATTEMPTS', { 'Retry-After': String(decision.retryAfter) });
}
