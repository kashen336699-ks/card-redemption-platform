import type {
  RedeemRequest,
  RedeemSuccess,
  RedeemProcessing,
  ErrorResponse,
} from '@card/contracts';

// 不硬编码 API 地址（项目规则）：走 VITE_API_BASE_URL；缺省回退 Mock。
const BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export type RedeemOutcome =
  | { kind: 'success'; data: RedeemSuccess }
  | { kind: 'processing'; data: RedeemProcessing }
  | { kind: 'error'; data: ErrorResponse };

export interface RedeemApi {
  submit(req: RedeemRequest): Promise<RedeemOutcome>;
  poll(id: string): Promise<RedeemOutcome>;
}

function classify(status: number, body: unknown): RedeemOutcome {
  const s = (body as { status?: string }).status;
  if (status === 200 && s === 'REDEEMED') return { kind: 'success', data: body as RedeemSuccess };
  if (status === 202 || s === 'PROCESSING') return { kind: 'processing', data: body as RedeemProcessing };
  return { kind: 'error', data: body as ErrorResponse };
}

export const httpApi: RedeemApi = {
  async submit(req) {
    const res = await fetch(`${BASE}/redemptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req), // 卡密只走请求体，不入 URL（SEC-003）
    });
    return classify(res.status, await res.json());
  },
  async poll(id) {
    const res = await fetch(`${BASE}/redemptions/${encodeURIComponent(id)}`);
    return classify(res.status, await res.json());
  },
};

export { classify };
