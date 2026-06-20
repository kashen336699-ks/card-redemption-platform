import { AppError } from '../lib/app-error.js';
import type { CardRecord } from './types.js';

// FR-102：卡密 6 态状态机。校验是否允许兑换，否则抛对应稳定错误码（FR-103/104/105/008）。
// 不暴露卡密是否"接近正确"（SEC-004）——不存在与各拒绝态都是明确独立错误码。
export function assertRedeemable(card: CardRecord | null, now: number): asserts card is CardRecord {
  if (!card) {
    throw new AppError('INVALID_CODE'); // FR-101 不存在
  }
  switch (card.status) {
    case 'AVAILABLE':
      break;
    case 'PROCESSING':
      // 短暂处理中：当作未完成，提示重试（不重复创建交付）
      throw new AppError('SYSTEM_ERROR');
    case 'REDEEMED':
      throw new AppError('ALREADY_REDEEMED'); // FR-107
    case 'EXPIRED':
      throw new AppError('EXPIRED_CODE');
    case 'DISABLED':
      throw new AppError('DISABLED_CODE');
    case 'NO_STOCK':
      throw new AppError('NO_STOCK');
    default: {
      const _exhaustive: never = card.status;
      throw new AppError('SYSTEM_ERROR', `unknown status ${_exhaustive}`);
    }
  }
  // FR-103 有效期（expiresAt=0 表示不过期）
  if (card.expiresAt && card.expiresAt < now) {
    throw new AppError('EXPIRED_CODE');
  }
}
