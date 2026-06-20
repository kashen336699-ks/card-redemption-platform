import { describe, it, expect } from 'vitest';
import { redeem } from '../../src/domain/redeem.js';
import { isAppError } from '../../src/lib/app-error.js';
import { MemRepo, seedOneCard } from '../helpers/mem-repo.js';

const HMAC = 'cardhmac0001';
const baseDeps = (repo: MemRepo, id: () => string) => ({
  repo,
  cardHmac: HMAC,
  cardLast4: 'NPQR',
  decryptPayload: async (c: string) => `plain-${c}`,
  newRedemptionId: id,
  ipHash: 'iphash',
  now: Date.now(),
});

let seq = 0;
const nextId = () => `RDM-T-${seq++}`;

async function run(repo: MemRepo, requestId: string) {
  try {
    return { ok: true as const, res: await redeem({ requestId }, baseDeps(repo, nextId)) };
  } catch (e) {
    return { ok: false as const, code: isAppError(e) ? e.code : 'THROW' };
  }
}

describe('SEC-002 / FR-302 / NFR-003 并发与幂等', () => {
  it('SEC-002: 同卡密 20 并发(不同 request_id) → 最多 1 条成功、最多 1 份库存被占用', async () => {
    const repo = new MemRepo();
    repo.delayMs = 1; // 制造交错
    seedOneCard(repo, HMAC, 'SKU-1', 3);

    const results = await Promise.all(
      Array.from({ length: 20 }, (_, i) => run(repo, `req-${i}`)),
    );
    const success = results.filter((r) => r.ok);
    const locked = (repo.inventory.get('SKU-1') ?? []).filter((i) => i.status !== 'AVAILABLE');

    expect(success.length).toBe(1);
    expect(repo.redemptions.length).toBe(1);
    expect(locked.length).toBe(1); // 最多一份库存被占用
    // 其余均为 ALREADY_REDEEMED（不暴露内部细节）
    const failCodes = new Set(results.filter((r) => !r.ok).map((r) => (r as { code: string }).code));
    expect([...failCodes].every((c) => c === 'ALREADY_REDEEMED')).toBe(true);
  });

  it('FR-302: 相同 request_id 重放 → 返回同一兑换编号，不二次创建', async () => {
    const repo = new MemRepo();
    seedOneCard(repo, HMAC, 'SKU-1', 3);
    const a = await run(repo, 'same-req');
    const b = await run(repo, 'same-req');
    expect(a.ok && b.ok).toBe(true);
    if (a.ok && b.ok) expect(a.res.redemption_id).toBe(b.res.redemption_id);
    expect(repo.redemptions.length).toBe(1);
  });

  it('FR-107: 已兑换卡密再次提交(新 request_id) → ALREADY_REDEEMED，不新建交付', async () => {
    const repo = new MemRepo();
    seedOneCard(repo, HMAC, 'SKU-1', 3);
    await run(repo, 'r1');
    const second = await run(repo, 'r2');
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.code).toBe('ALREADY_REDEEMED');
    expect(repo.redemptions.length).toBe(1);
  });

  it('NFR-003: 无库存 → NO_STOCK，卡密保持 AVAILABLE 可恢复', async () => {
    const repo = new MemRepo();
    seedOneCard(repo, HMAC, 'SKU-1', 0);
    const r = await run(repo, 'r1');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('NO_STOCK');
    expect(repo.cards.get(HMAC)?.status).toBe('AVAILABLE');
  });

  it('SEC-006 (F-101): 幂等记录只存交付密文，不含明文', async () => {
    const repo = new MemRepo();
    seedOneCard(repo, HMAC, 'SKU-1', 3);
    const a = await run(repo, 'req-x');
    expect(a.ok).toBe(true);
    const stored = repo.idempotency.get('req-x')!;
    expect(stored).toHaveProperty('deliveryCipher');
    expect(stored).not.toHaveProperty('response');
    // 记录序列化中不出现解密后的明文（mock decrypt 产出 plain-*）
    expect(JSON.stringify(stored)).not.toMatch(/plain-/);
  });
});
