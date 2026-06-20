// SEC-005：限流纯决策（连续失败递增等待，指数退避封顶）。无 AWS 依赖，便于单测。
export interface RateDecision {
  allowed: boolean;
  retryAfter: number; // 秒
}

export const MAX_ATTEMPTS = 10;
export const WINDOW_SEC = 60;

export function decideRate(
  attempts: number,
  max = MAX_ATTEMPTS,
  windowSec = WINDOW_SEC,
): RateDecision {
  if (attempts <= max) return { allowed: true, retryAfter: 0 };
  const over = attempts - max;
  const retryAfter = Math.min(windowSec, 2 ** Math.min(over, 6));
  return { allowed: false, retryAfter };
}
