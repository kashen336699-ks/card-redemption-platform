import type { CardStatus, DeliveryType, RedeemSuccess, Product } from '@card/contracts';

export interface CardRecord {
  cardHmac: string;
  productSku: string;
  status: CardStatus;
  expiresAt: number; // epoch 秒；0 表示不过期
  orderRef?: string;
}

export interface ProductRecord {
  sku: string;
  name: string;
  spec?: string;
  deliveryType: DeliveryType;
  status: 'ON' | 'OFF';
}

export interface InventoryRecord {
  invId: string;
  productSku: string;
  status: 'AVAILABLE' | 'LOCKED' | 'DELIVERED';
  encryptedPayload: string; // KMS 密文（base64）
}

export interface CommitInput {
  card: CardRecord;
  product: ProductRecord;
  inventory: InventoryRecord;
  requestId: string;
  redemptionId: string;
  ipHash: string;
  cardLast4: string; // 卡密规范化末四位（售后定位 FR-207；仅末四位 SEC-007）
  now: number;
  deliveryPlaintext: string; // 已解密的交付内容（仅内存）
}

// 幂等存储的处理结果。SEC-006：不存交付明文，只存 KMS 密文，重放/GET 时再解密。
export interface StoredResult {
  redemptionId: string;
  product: Product; // 仅 name/spec/delivery_type，无敏感内容
  deliveryType: DeliveryType;
  deliveryCipher: string; // KMS 密文（base64），与库分离的字段级加密
  redeemedAt?: string;
}

// 抛出表示底层条件写失败（并发竞争输了），domain 据此返回 ALREADY_REDEEMED
export class ConditionalFailure extends Error {
  constructor() {
    super('conditional check failed');
    this.name = 'ConditionalFailure';
  }
}

// repository 端口：domain 不依赖 AWS SDK，便于单测与替换（lambda.md 分层）
export interface RedeemRepository {
  getIdempotent(requestId: string): Promise<StoredResult | null>;
  getCardByIndex(cardHmac: string): Promise<CardRecord | null>;
  getProduct(sku: string): Promise<ProductRecord | null>;
  getAvailableInventory(sku: string): Promise<InventoryRecord | null>;
  // 原子提交：单事务内 卡密条件更新(AVAILABLE→REDEEMED) + 库存锁定 + 兑换记录 + 幂等键。
  // 任一条件失败抛 ConditionalFailure，整体回滚（SEC-002/FR-106/NFR-003）。
  commitRedemption(input: CommitInput): Promise<RedeemSuccess>;
}
