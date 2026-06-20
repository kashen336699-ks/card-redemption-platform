import { createHmac, timingSafeEqual } from 'node:crypto';

// SEC-001：卡密不存明文。用 HMAC-SHA256 索引值查询。
// 规范化：去首尾空格、忽略分隔符、统一大写（与前端 FR-001 对齐），存储不依赖分隔符。

const SEPARATORS = /[\s\-_]+/g;

export function normalizeCode(raw: string): string {
  return raw.replace(SEPARATORS, '').trim().toUpperCase();
}

// 返回 hex 索引；key 来自 Secrets Manager（secret.ts），与数据库分离。
export function computeCardIndex(rawCode: string, key: string): string {
  const normalized = normalizeCode(rawCode);
  if (normalized.length === 0) {
    // 不在错误信息里回显卡密（SEC-004）
    throw new Error('empty code');
  }
  return createHmac('sha256', key).update(normalized, 'utf8').digest('hex');
}

// 常量时间比较，避免时序侧信道（防"接近正确"探测 SEC-004）
export function safeIndexEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'hex');
  const bb = Buffer.from(b, 'hex');
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

// 脱敏：仅保留末四位用于售后/日志（SEC-007）
export function maskCode(rawCode: string): string {
  const n = normalizeCode(rawCode);
  const last4 = n.slice(-4);
  return `****-****-****-${last4}`;
}

export function lastFour(rawCode: string): string {
  return normalizeCode(rawCode).slice(-4);
}
