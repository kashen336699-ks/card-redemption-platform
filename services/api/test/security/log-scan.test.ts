import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { log } from '../../src/lib/logger.js';

// SEC-007：日志/埋点中不出现完整卡密与交付内容明文。
// 捕获 logger 实际输出，扫描敏感明文是否泄露。
describe('SEC-007: 日志扫描——无完整卡密/交付明文', () => {
  let lines: string[] = [];
  let spy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    lines = [];
    spy = vi.spyOn(console, 'log').mockImplementation((l: unknown) => {
      lines.push(String(l));
    });
  });
  afterEach(() => spy.mockRestore());

  it('记录兑换事件时卡密与交付明文被脱敏', () => {
    const fullCode = 'ABCD-EFGH-JKLM-NPQR';
    const deliverySecret = 'QH7M-9XKD-22LP-AB6F';
    log.info({
      event: 'redeem_result',
      code: fullCode,
      delivery: { text: deliverySecret },
      redemptionId: 'RDM-20260619-0007',
      result_code: 'REDEEMED',
    });
    const out = lines.join('\n');
    expect(out).not.toContain(fullCode);
    expect(out).not.toContain(deliverySecret);
    expect(out).toContain('RDM-20260619-0007'); // 兑换编号可检索
    expect(out).toContain('[REDACTED]');
  });
});
