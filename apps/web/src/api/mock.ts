import type { RedeemRequest } from '@card/contracts';
import { ERROR_CATALOG } from '@card/contracts';
import { httpApi, type RedeemApi, type RedeemOutcome } from './client.js';
import { normalizeCode } from './normalize.js';

// 契约冻结后前端用 Mock Server 并行开发（PLAN.md 并行规则）。
// 按规范化卡密前缀返回不同结果，便于演示与组件测试。
const SUCCESS_DELIVERY = {
  type: 'code' as const,
  text: 'QH7M-9XKD-22LP-AB6F',
};

export const mockApi: RedeemApi = {
  async submit(req: RedeemRequest): Promise<RedeemOutcome> {
    const code = normalizeCode(req.code);
    await delay(400);
    if (code.startsWith('REDEEMED')) return err('ALREADY_REDEEMED');
    if (code.startsWith('EXPIRED')) return err('EXPIRED_CODE');
    if (code.startsWith('DISABLED')) return err('DISABLED_CODE');
    if (code.startsWith('NOSTOCK')) return err('NO_STOCK');
    if (code.startsWith('BADCODE')) return err('INVALID_CODE');
    return {
      kind: 'success',
      data: {
        redemption_id: 'RDM-20260619-0007',
        status: 'REDEEMED',
        product: { name: 'XX 视频会员季卡', spec: '激活后 90 天有效 · 单设备', delivery_type: 'code' },
        delivery: SUCCESS_DELIVERY,
        redeemed_at: new Date().toISOString(),
      },
    };
  },
  async poll(): Promise<RedeemOutcome> {
    return {
      kind: 'success',
      data: {
        redemption_id: 'RDM-20260619-0007',
        status: 'REDEEMED',
        product: { name: 'XX 视频会员季卡', delivery_type: 'code' },
        delivery: SUCCESS_DELIVERY,
      },
    };
  },
};

function err(code: keyof typeof ERROR_CATALOG): RedeemOutcome {
  const m = ERROR_CATALOG[code];
  return { kind: 'error', data: { error_code: code, message: m.message, action: m.action } };
}
function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// 默认 API：配了真实地址用 http，否则用 mock（本地开发/演示）
export function resolveApi(): RedeemApi {
  return import.meta.env.VITE_API_BASE_URL ? httpApi : mockApi;
}
