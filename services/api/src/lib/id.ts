import { randomUUID, createHash } from 'node:crypto';

// 兑换编号：RDM-YYYYMMDD-XXXXXX（便于用户截图与售后查询 FR-005）
export function newRedemptionId(now: number = Date.now()): string {
  const d = new Date(now);
  const ymd = `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
  const rand = randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase();
  return `RDM-${ymd}-${rand}`;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

// SEC-007：IP 哈希存储（截断），不存原始 IP
export function hashIp(ip: string, salt: string): string {
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 16);
}
