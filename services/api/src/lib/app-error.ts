import type { ErrorCode } from '@card/contracts';

// 业务错误：携带稳定错误码，handler 据此映射 HTTP + 文案。
// 绝不在 message/detail 中放卡密明文、库存 ID、DB 错误或风控阈值（SEC-004）。
export class AppError extends Error {
  readonly code: ErrorCode;

  constructor(code: ErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
    this.name = 'AppError';
  }
}

export function isAppError(e: unknown): e is AppError {
  return e instanceof AppError;
}
