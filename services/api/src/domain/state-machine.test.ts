import { describe, it, expect } from 'vitest';
import { assertRedeemable } from './state-machine.js';
import { isAppError } from '../lib/app-error.js';
import type { CardRecord } from './types.js';

const now = Math.floor(Date.now() / 1000);
const card = (over: Partial<CardRecord>): CardRecord => ({
  cardHmac: 'h',
  productSku: 's',
  status: 'AVAILABLE',
  expiresAt: 0,
  ...over,
});
const codeOf = (fn: () => void): string => {
  try {
    fn();
    return 'OK';
  } catch (e) {
    return isAppError(e) ? e.code : 'THROW';
  }
};

describe('FR-102: 卡密状态机 → 稳定错误码', () => {
  it('不存在 → INVALID_CODE', () => expect(codeOf(() => assertRedeemable(null, now))).toBe('INVALID_CODE'));
  it('REDEEMED → ALREADY_REDEEMED', () =>
    expect(codeOf(() => assertRedeemable(card({ status: 'REDEEMED' }), now))).toBe('ALREADY_REDEEMED'));
  it('DISABLED → DISABLED_CODE', () =>
    expect(codeOf(() => assertRedeemable(card({ status: 'DISABLED' }), now))).toBe('DISABLED_CODE'));
  it('EXPIRED 状态 → EXPIRED_CODE', () =>
    expect(codeOf(() => assertRedeemable(card({ status: 'EXPIRED' }), now))).toBe('EXPIRED_CODE'));
  it('AVAILABLE 但超期 → EXPIRED_CODE', () =>
    expect(codeOf(() => assertRedeemable(card({ expiresAt: now - 10 }), now))).toBe('EXPIRED_CODE'));
  it('NO_STOCK 状态 → NO_STOCK', () =>
    expect(codeOf(() => assertRedeemable(card({ status: 'NO_STOCK' }), now))).toBe('NO_STOCK'));
  it('AVAILABLE 未过期 → 通过', () =>
    expect(codeOf(() => assertRedeemable(card({}), now))).toBe('OK'));
});
