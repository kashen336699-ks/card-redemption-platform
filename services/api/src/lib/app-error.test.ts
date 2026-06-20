import { describe, it, expect } from 'vitest';
import { AppError, isAppError } from './app-error.js';

describe('scaffold: AppError', () => {
  it('NFR-006: 携带稳定错误码', () => {
    const e = new AppError('INVALID_CODE');
    expect(isAppError(e)).toBe(true);
    expect(e.code).toBe('INVALID_CODE');
  });
});
