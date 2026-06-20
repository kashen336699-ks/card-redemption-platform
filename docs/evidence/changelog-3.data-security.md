# Changelog — 3.data-security（G4）

- 日期：2026-06-19
- 关联需求：SEC-001、SEC-006、SEC-009

## 变更摘要
- `crypto/hmac.ts`：`normalizeCode`（去空格/分隔符/统一大写，对齐 FR-001）、`computeCardIndex`（HMAC-SHA256 hex 索引，node:crypto，密钥外部注入）、`safeIndexEqual`（常量时间比较，防时序探测 SEC-004）、`maskCode`/`lastFour`（脱敏末四位 SEC-007）。纯函数、零 AWS 依赖。
- `crypto/kms.ts`：`encryptField`/`decryptField`，KMS Encrypt/Decrypt，client 模块级缓存（SEC-006，密钥与数据分离）。
- `crypto/secret.ts`：`getHmacKey` 从 Secrets Manager 取 HMAC 密钥，模块缓存，取失败显式抛错不静默降级（SEC-001）。
- `infrastructure`：CDK 加 `FieldEncryptionKey`（KMS，启用轮换）+ `HmacIndexKey`（Secrets Manager 自动生成 48 位）。最小权限 IAM 在 2.redeem-api 给 Lambda 逐项授予（grantEncryptDecrypt/grantRead，不用 `*`）。

## 验证
- HMAC 核心：`node --experimental-strip-types` 跑 8 条断言全过 ✅
  - 规范化一致性、同卡密不同书写同索引、不同卡密不同索引、索引为 64 位 hex 且不含明文（SEC-001）、空码抛错不回显、常量时间比较、脱敏末四位。
- KMS/Secret 封装为真实 AWS SDK 代码；mock 测试与 `cdk synth` 在用户本地原生环境执行（沙箱 npm install 受限，见 lessons.md）。
