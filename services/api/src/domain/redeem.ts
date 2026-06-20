import type { RedeemSuccess, Delivery, DeliveryType } from '@card/contracts';
import { AppError } from '../lib/app-error.js';
import { assertRedeemable } from './state-machine.js';
import {
  ConditionalFailure,
  type RedeemRepository,
  type ProductRecord,
  type InventoryRecord,
  type StoredResult,
} from './types.js';

export interface RedeemDeps {
  repo: RedeemRepository;
  cardHmac: string; // 已由 crypto.computeCardIndex 算好（domain 不碰密钥）
  cardLast4: string; // 卡密规范化末四位（售后定位 FR-207）
  decryptPayload: (ciphertext: string) => Promise<string>;
  newRedemptionId: () => string;
  ipHash: string;
  now: number;
}

export interface RedeemInput {
  requestId: string;
}

// 兑换用例（纯编排，不依赖 AWS SDK）。
// 幂等 + 状态机 + 原子提交；并发只成功一次（SEC-002）。
export async function redeem(input: RedeemInput, deps: RedeemDeps): Promise<RedeemSuccess> {
  const { repo } = deps;

  // FR-302/107：重复 request_id → 返回同一处理结果，不再创建交付。
  // 幂等记录只存密文，重放时再解密（SEC-006）。
  const prior = await repo.getIdempotent(input.requestId);
  if (prior) return reconstructSuccess(prior, deps.decryptPayload);

  const card = await repo.getCardByIndex(deps.cardHmac);
  assertRedeemable(card, deps.now); // 抛 AppError（INVALID/EXPIRED/...）

  const product = await repo.getProduct(card.productSku);
  if (!product || product.status === 'OFF') {
    throw new AppError('INVALID_CODE'); // 绑定商品缺失/下架，对用户等同无效
  }

  const inventory = await repo.getAvailableInventory(card.productSku);
  if (!inventory) {
    throw new AppError('NO_STOCK'); // FR-105
  }

  // 交付内容仅在内存解密（SEC-006），不落明文
  const deliveryPlaintext = await deps.decryptPayload(inventory.encryptedPayload);
  const redemptionId = deps.newRedemptionId();

  try {
    // FR-106/SEC-002：单事务 卡密条件更新 + 库存锁定 + 兑换记录 + 幂等键
    return await repo.commitRedemption({
      card,
      product,
      inventory,
      requestId: input.requestId,
      redemptionId,
      ipHash: deps.ipHash,
      cardLast4: deps.cardLast4,
      now: deps.now,
      deliveryPlaintext,
    });
  } catch (e) {
    if (e instanceof ConditionalFailure) {
      // 并发竞争输了：对方已把卡密置 REDEEMED（NFR-003 状态可恢复，本次未消耗额外库存）
      const after = await repo.getIdempotent(input.requestId);
      if (after) return reconstructSuccess(after, deps.decryptPayload);
      throw new AppError('ALREADY_REDEEMED');
    }
    throw e;
  }
}

// 从幂等记录（仅含密文）重建对外成功响应：按需解密交付内容（SEC-006）。
// 用于幂等重放与 GET /redemptions/{id}。
export async function reconstructSuccess(
  stored: StoredResult,
  decrypt: (ciphertext: string) => Promise<string>,
): Promise<RedeemSuccess> {
  const plaintext = await decrypt(stored.deliveryCipher);
  return {
    redemption_id: stored.redemptionId,
    status: 'REDEEMED',
    product: stored.product,
    delivery: buildDelivery(stored.deliveryType, plaintext),
    redeemed_at: stored.redeemedAt,
  };
}

// 按 delivery_type 组装对外交付结构（FR-006）
export function buildDelivery(type: DeliveryType, plaintext: string): Delivery {
  switch (type) {
    case 'link':
    case 'file':
      return { type, url: plaintext };
    case 'guide':
      return { type, guide: plaintext };
    case 'text':
    case 'code':
    default:
      return { type, text: plaintext };
  }
}

export function toProductView(p: ProductRecord) {
  return { name: p.name, spec: p.spec, delivery_type: p.deliveryType };
}

export type { InventoryRecord };
