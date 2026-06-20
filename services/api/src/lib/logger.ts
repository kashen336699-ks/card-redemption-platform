// NFR-006：结构化 JSON 日志 + Correlation ID，可按兑换编号检索。
// SEC-007：脱敏中间件——禁止记录完整卡密与交付明文。

const SENSITIVE_KEYS = new Set([
  'code',
  'rawCode',
  'plaintext',
  'deliveryPlaintext',
  'delivery',
  'payload',
  'encryptedPayload',
  'secretString',
]);

function redact(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(k)) {
      out[k] = '[REDACTED]';
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = redact(v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function emit(level: 'info' | 'warn' | 'error', fields: Record<string, unknown>): void {
  const line = JSON.stringify({ level, ts: new Date().toISOString(), ...redact(fields) });
  // eslint-disable-next-line no-console
  (level === 'error' ? console.error : console.log)(line);
}

export const log = {
  info: (f: Record<string, unknown>) => emit('info', f),
  warn: (f: Record<string, unknown>) => emit('warn', f),
  error: (f: Record<string, unknown>) => emit('error', f),
  redact,
};
