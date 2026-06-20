import { describe, it, expect } from 'vitest';
import { log } from '../../src/lib/logger.js';
import { errorResponse, fromError } from '../../src/lib/http.js';
import { AppError } from '../../src/lib/app-error.js';

describe('SEC-007: 日志脱敏', () => {
  it('卡密/交付/payload 脱敏，兑换编号保留', () => {
    const r = log.redact({
      code: 'ABCD-EFGH',
      delivery: { text: 'secret-content' },
      redemptionId: 'RDM-1',
      nested: { payload: 'x' },
    });
    expect(r.code).toBe('[REDACTED]');
    expect(r.delivery).toBe('[REDACTED]');
    expect(r.redemptionId).toBe('RDM-1');
    expect((r.nested as Record<string, unknown>).payload).toBe('[REDACTED]');
  });
});

describe('SEC-004: 错误响应不泄露内部细节', () => {
  it('错误响应只含错误码 + 文案 + 动作，无内部字段', () => {
    const res = errorResponse('ALREADY_REDEEMED');
    const body = JSON.parse(res.body);
    expect(Object.keys(body).sort()).toEqual(['action', 'error_code', 'message']);
    expect(res.body).not.toMatch(/inventory|sku|stack|dynamo|hmac/i);
  });
  it('未知异常 → SYSTEM_ERROR，不透传内部错误', () => {
    const res = fromError(new Error('DynamoDB ProvisionedThroughputExceeded at table xyz'));
    const body = JSON.parse(res.body);
    expect(body.error_code).toBe('SYSTEM_ERROR');
    expect(res.body).not.toMatch(/DynamoDB|table|xyz/);
  });
  it('AppError 映射对应 HTTP', () => {
    expect(fromError(new AppError('TOO_MANY_ATTEMPTS')).statusCode).toBe(429);
    expect(fromError(new AppError('EXPIRED_CODE')).statusCode).toBe(409);
  });
  it('安全头存在（SEC-003）', () => {
    const res = errorResponse('INVALID_CODE');
    expect(res.headers['Strict-Transport-Security']).toMatch(/max-age/);
    expect(res.headers['X-Content-Type-Options']).toBe('nosniff');
  });
});
