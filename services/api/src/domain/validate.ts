import { AppError } from '../lib/app-error.js';

// 输入白名单校验（FR-002 后端兜底；SEC-008 输入白名单）。
// 不暴露卡密是否"接近正确"——长度/字符不合法统一 VALIDATION_ERROR。

const CODE_ALLOWED = /^[A-Za-z0-9\-_\s]+$/;
const UUID_RE = /^[0-9a-fA-F-]{8,64}$/;

export interface ValidatedRedeem {
  code: string;
  requestId: string;
  clientTs?: number;
}

export function validateRedeemRequest(raw: unknown): ValidatedRedeem {
  if (typeof raw !== 'object' || raw === null) throw new AppError('VALIDATION_ERROR');
  const r = raw as Record<string, unknown>;

  const code = r.code;
  if (typeof code !== 'string') throw new AppError('VALIDATION_ERROR');
  const normalizedLen = code.replace(/[\s\-_]+/g, '').length;
  if (normalizedLen < 8 || normalizedLen > 40 || !CODE_ALLOWED.test(code)) {
    throw new AppError('VALIDATION_ERROR');
  }

  const requestId = r.request_id;
  if (typeof requestId !== 'string' || !UUID_RE.test(requestId)) {
    throw new AppError('VALIDATION_ERROR');
  }

  const clientTs = typeof r.client_ts === 'number' ? r.client_ts : undefined;
  return { code, requestId, clientTs };
}

export function validateSupportLookup(raw: unknown): {
  codeLast4?: string;
  orderRef?: string;
  redemptionId?: string;
} {
  if (typeof raw !== 'object' || raw === null) throw new AppError('VALIDATION_ERROR');
  const r = raw as Record<string, unknown>;
  const codeLast4 = typeof r.code_last4 === 'string' ? r.code_last4 : undefined;
  const orderRef = typeof r.order_ref === 'string' ? r.order_ref : undefined;
  const redemptionId = typeof r.redemption_id === 'string' ? r.redemption_id : undefined;
  if (!codeLast4 && !orderRef && !redemptionId) throw new AppError('VALIDATION_ERROR');
  if (codeLast4 && !/^[A-Za-z0-9]{4}$/.test(codeLast4)) throw new AppError('VALIDATION_ERROR');
  return { codeLast4, orderRef, redemptionId };
}
