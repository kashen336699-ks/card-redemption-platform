import { describe, it, expect } from 'vitest';
import { normalizeCode, computeCardIndex, safeIndexEqual, maskCode, lastFour } from './hmac.js';

const KEY = 'test-hmac-key-do-not-use-in-prod';

describe('SEC-001: HMAC 卡密索引', () => {
  it('FR-001: 规范化去空格/分隔符/统一大写', () => {
    expect(normalizeCode('  abcd-efgh jklm_npqr ')).toBe('ABCDEFGHJKLMNPQR');
  });

  it('同一卡密不同书写形式 → 同一索引', () => {
    const a = computeCardIndex('abcd-efgh-jklm-npqr', KEY);
    const b = computeCardIndex(' ABCD EFGH JKLM NPQR ', KEY);
    expect(a).toBe(b);
  });

  it('不同卡密 → 不同索引', () => {
    expect(computeCardIndex('ABCD-EFGH', KEY)).not.toBe(computeCardIndex('ABCD-EFGI', KEY));
  });

  it('索引为不可逆 hex（64 字符），不含明文', () => {
    const idx = computeCardIndex('SECRET-CODE-1234', KEY);
    expect(idx).toMatch(/^[0-9a-f]{64}$/);
    expect(idx).not.toContain('SECRET');
  });

  it('空卡密抛错且不回显内容', () => {
    expect(() => computeCardIndex('   ', KEY)).toThrowError('empty code');
  });

  it('safeIndexEqual 常量时间比较', () => {
    const idx = computeCardIndex('ABCD-EFGH-JKLM-NPQR', KEY);
    expect(safeIndexEqual(idx, idx)).toBe(true);
    expect(safeIndexEqual(idx, computeCardIndex('X', KEY))).toBe(false);
  });

  it('SEC-007: 脱敏仅留末四位', () => {
    expect(maskCode('ABCD-EFGH-JKLM-NPQR')).toBe('****-****-****-NPQR');
    expect(lastFour('abcd-efgh-jklm-npqr')).toBe('NPQR');
  });
});
