// FR-303：前端埋点 5 事件。MVP 用轻量 beacon，不引入第三方 SDK。
// 不上报卡密明文/交付内容（SEC-007），只报结果码、SKU、耗时等非敏感属性。

export type AnalyticsEvent =
  | { name: 'page_view'; source?: string; device?: string; referrer?: string }
  | { name: 'code_submit'; format_valid: boolean; attempt_index: number }
  | { name: 'redeem_result'; result_code: string; product_sku?: string; latency: number }
  | { name: 'delivery_copy'; delivery_type: string; redemption_id: string }
  | { name: 'support_click'; result_code: string; redemption_id?: string };

const ENDPOINT = import.meta.env.VITE_ANALYTICS_URL ?? '';

export function track(event: AnalyticsEvent): void {
  // 不记录卡密/交付明文：事件结构本身已排除（类型约束）。
  const payload = JSON.stringify({ ...event, ts: Date.now() });
  try {
    if (ENDPOINT && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, payload);
    } else if (import.meta.env.DEV) {
      // 开发环境仅打印（不含敏感字段）
      // eslint-disable-next-line no-console
      console.debug('[analytics]', payload);
    }
  } catch {
    /* 埋点失败静默，不影响主流程 */
  }
}
