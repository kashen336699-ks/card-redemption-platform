import { ERROR_CATALOG, type ErrorCode, type ErrorResponse } from '@card/contracts';
import { AppError } from './app-error.js';

export interface HttpResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

// SEC-003：全站 HTTPS/HSTS；SEC-008：CSP/安全头由 CloudFront + 此处兜底
const SECURITY_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json; charset=utf-8',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Cache-Control': 'no-store',
};

export function ok(body: unknown, statusCode = 200, extraHeaders: Record<string, string> = {}): HttpResponse {
  return { statusCode, headers: { ...SECURITY_HEADERS, ...extraHeaders }, body: JSON.stringify(body) };
}

const ACTION_MAP = {
  retry_input: 'retry_input',
  contact_support: 'contact_support',
  retry_later: 'retry_later',
  wait: 'wait',
  resubmit: 'resubmit',
} as const;

// 把错误码映射为稳定 HTTP 响应（SEC-004：不漏内部细节）
export function errorResponse(code: ErrorCode, extraHeaders: Record<string, string> = {}): HttpResponse {
  if (code === 'NOT_FOUND') {
    const body: ErrorResponse = { error_code: 'NOT_FOUND', message: '未找到对应记录' };
    return ok(body, 404, extraHeaders);
  }
  if (code === 'VALIDATION_ERROR') {
    const body: ErrorResponse = {
      error_code: 'VALIDATION_ERROR',
      message: '请求格式有误，请检查后重试',
      action: 'retry_input',
    };
    return ok(body, 422, extraHeaders);
  }
  const meta = ERROR_CATALOG[code];
  const body: ErrorResponse = { error_code: code, message: meta.message, action: ACTION_MAP[meta.action] };
  return ok(body, meta.http, extraHeaders);
}

export function fromError(e: unknown): HttpResponse {
  if (e instanceof AppError) return errorResponse(e.code);
  // 未知异常：SYSTEM_ERROR（本次未消耗卡密 NFR-003），不透传内部错误（SEC-004）
  return errorResponse('SYSTEM_ERROR');
}
