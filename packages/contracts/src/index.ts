// TS 类型 — 由 docs/contracts/openapi.yaml (FROZEN v1.0.0, ADR-0002) 派生。
// 前后端共享；不得脱离契约私自加字段（项目规则 L2）。

export type CardStatus =
  | 'AVAILABLE'
  | 'PROCESSING'
  | 'REDEEMED'
  | 'EXPIRED'
  | 'DISABLED'
  | 'NO_STOCK';

export type DeliveryType = 'text' | 'code' | 'link' | 'file' | 'guide';

export type ErrorCode =
  | 'INVALID_CODE'
  | 'ALREADY_REDEEMED'
  | 'EXPIRED_CODE'
  | 'DISABLED_CODE'
  | 'NO_STOCK'
  | 'TOO_MANY_ATTEMPTS'
  | 'SYSTEM_ERROR'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR';

export type ErrorAction =
  | 'retry_input'
  | 'contact_support'
  | 'retry_later'
  | 'wait'
  | 'resubmit';

export interface RedeemRequest {
  code: string;
  request_id: string;
  client_ts?: number;
}

export interface Product {
  name: string;
  spec?: string;
  delivery_type: DeliveryType;
}

export interface Delivery {
  type: DeliveryType;
  text?: string;
  url?: string;
  guide?: string;
}

export interface RedeemSuccess {
  redemption_id: string;
  status: 'REDEEMED';
  product: Product;
  delivery: Delivery;
  redeemed_at?: string;
}

export interface RedeemProcessing {
  redemption_id: string;
  status: 'PROCESSING';
  poll_after_ms?: number;
}

export interface ErrorResponse {
  error_code: ErrorCode;
  message: string;
  action?: ErrorAction;
}

export interface SupportLookupRequest {
  code_last4?: string;
  order_ref?: string;
  redemption_id?: string;
}

export interface SupportLogEntry {
  action: string;
  at: string;
}

export interface SupportLookupResult {
  masked_code: string;
  status: CardStatus;
  product_name?: string;
  redeemed_at?: string | null;
  log_summary?: SupportLogEntry[];
}

export type RedeemResponse = RedeemSuccess | RedeemProcessing | ErrorResponse;

// 错误码 → 用户文案 + 建议动作（PRD §6.3，前后端共用，保证文案稳定）
export const ERROR_CATALOG: Record<
  Exclude<ErrorCode, 'NOT_FOUND' | 'VALIDATION_ERROR'>,
  { message: string; action: ErrorAction; http: number }
> = {
  INVALID_CODE: { message: '未找到该卡密，请检查后重新输入', action: 'retry_input', http: 409 },
  ALREADY_REDEEMED: { message: '该卡密已兑换，如非本人操作请联系售后', action: 'contact_support', http: 409 },
  EXPIRED_CODE: { message: '该卡密已过期，请联系商家处理', action: 'contact_support', http: 409 },
  DISABLED_CODE: { message: '该卡密当前不可用，请联系商家处理', action: 'contact_support', http: 409 },
  NO_STOCK: { message: '商品正在补充中，请稍后重试', action: 'retry_later', http: 409 },
  TOO_MANY_ATTEMPTS: { message: '尝试次数过多，请稍后再试', action: 'wait', http: 429 },
  SYSTEM_ERROR: { message: '系统开小差了，本次未消耗卡密', action: 'resubmit', http: 500 },
};
