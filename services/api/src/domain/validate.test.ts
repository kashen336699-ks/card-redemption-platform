import { describe, it, expect } from 'vitest';
import { validateRedeemRequest, validateSupportLookup } from './validate.js';
import { isAppError } from '../lib/app-error.js';

const REQ = '11111111-2222-3333-4444-555555555555';
const codeOf = (fn: () => void): string => {
  try {
    fn();
    return 'OK';
  } catch (e) {
    return isAppError(e) ? e.code : 'THROW';
  }
};

describe('FR-002/SEC-008: 输入白名单校验', () => {
  it('合法卡密 + uuid → OK', () =>
    expect(codeOf(() => validateRedeemRequest({ code: 'ABCD-EFGH-JKLM-NPQR', request_id: REQ }))).toBe('OK'));
  it('过短卡密 → VALIDATION_ERROR', () =>
    expect(codeOf(() => validateRedeemRequest({ code: 'short', request_id: REQ }))).toBe('VALIDATION_ERROR'));
  it('非法 request_id → VALIDATION_ERROR', () =>
    expect(codeOf(() => validateRedeemRequest({ code: 'ABCD-EFGH-JKLM-NPQR', request_id: 'bad!!' }))).toBe(
      'VALIDATION_ERROR',
    ));
  it('注入字符 → VALIDATION_ERROR', () =>
    expect(
      codeOf(() => validateRedeemRequest({ code: '<script>alertxx</script>', request_id: REQ })),
    ).toBe('VALIDATION_ERROR'));
  it('售后查询三条件全空 → VALIDATION_ERROR', () =>
    expect(codeOf(() => validateSupportLookup({}))).toBe('VALIDATION_ERROR'));
  it('售后末四位 → OK', () =>
    expect(codeOf(() => validateSupportLookup({ code_last4: 'AB6F' }))).toBe('OK'));
});
