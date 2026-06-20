// FR-001：前端规范化——去首尾空格、忽略分隔符、统一大写（与后端 crypto.normalizeCode 对齐）。
const SEPARATORS = /[\s\-_]+/g;

// 幂等键生成：优先 crypto.randomUUID（安全上下文），回退到兼容实现
// （部分浏览器/非安全上下文/测试环境无 randomUUID）。
export function genRequestId(): string {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function normalizeCode(raw: string): string {
  return raw.replace(SEPARATORS, '').trim().toUpperCase();
}

// FR-002：前端基础校验（后端仍兜底）。返回 null 表示通过，否则返回提示文案。
export function validateCode(raw: string): string | null {
  const n = normalizeCode(raw);
  if (n.length === 0) return '请输入卡密';
  if (!/^[A-Z0-9]+$/.test(n)) return '卡密含非法字符，请检查后重试';
  if (n.length < 8 || n.length > 40) return '卡密长度有误，请检查后重试';
  return null;
}
