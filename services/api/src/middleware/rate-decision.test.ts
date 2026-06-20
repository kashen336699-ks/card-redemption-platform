import { describe, it, expect } from 'vitest';
import { decideRate } from './rate-decision.js';

describe('SEC-005: 限流递增等待', () => {
  it('未超阈值放行', () => {
    expect(decideRate(5).allowed).toBe(true);
    expect(decideRate(10).allowed).toBe(true);
  });
  it('超阈值拒绝并给 Retry-After', () => {
    expect(decideRate(11).allowed).toBe(false);
    expect(decideRate(11).retryAfter).toBeGreaterThanOrEqual(1);
  });
  it('递增等待封顶窗口长度', () => {
    expect(decideRate(100).retryAfter).toBeLessThanOrEqual(60);
  });
});
