import { describe, it, expect } from 'vitest';
import { normalizeCode, validateCode } from './normalize.js';

describe('FR-001/002: 卡密规范化与校验', () => {
  it('去空格/分隔符/统一大写', () => {
    expect(normalizeCode('  abcd-efgh jklm_npqr ')).toBe('ABCDEFGHJKLMNPQR');
  });
  it('空值提示', () => expect(validateCode('')).toBe('请输入卡密'));
  it('合法卡密通过', () => expect(validateCode('abcd-efgh-jklm-npqr')).toBeNull());
  it('过短提示', () => expect(validateCode('short')).toMatch(/长度/));
  it('非法字符提示', () => expect(validateCode('<script>xxxxxx</script>')).toMatch(/非法/));
});
