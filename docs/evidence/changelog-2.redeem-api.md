# Changelog — 2.redeem-api（G4）

- 日期：2026-06-19
- 关联需求：FR-004/008/010/101–107/207/302、SEC-002/004、NFR-003

## 变更摘要
- `domain/types.ts`：领域类型 + `RedeemRepository` 端口（domain 不依赖 AWS SDK）+ `ConditionalFailure`。
- `domain/state-machine.ts`：6 态状态机 `assertRedeemable`，映射稳定错误码（FR-102/103）。
- `domain/redeem.ts`：兑换用例编排——幂等命中→状态机→商品/库存→KMS 解密（仅内存）→原子提交；竞争失败回 ALREADY_REDEEMED（SEC-002）。`buildDelivery` 按 delivery_type 组装（FR-006）。
- `domain/validate.ts`：输入白名单（FR-002/SEC-008），非法统一 VALIDATION_ERROR，不暴露"接近正确"。
- `repository/dynamo.ts`：DynamoDB 单表访问；`commitRedemption` 用 `TransactWriteItems`（卡密条件更新 AVAILABLE→REDEEMED + 库存锁定 + 兑换记录 + 幂等键，任一失败整体回滚）；售后/查询方法。
- `handlers/`：redeem（POST，限流+校验+审计+错误码映射）、get-redemption（GET 轮询/终态）、support（脱敏查询）。
- `lib/`：`http.ts`（安全头 + 错误码→HTTP 映射，SEC-003/004）、`id.ts`（兑换编号 + IP 哈希 SEC-007）、`app-error.ts`。
- `infrastructure`：DynamoDB 单表（PK/SK + GSI1 + TTL 90 天 + PITR）+ 3 个 NodejsFunction + HTTP API + 最小权限授予（grantReadWrite/grantDecrypt/grantRead，无 `*`）。

## 验证（node --experimental-strip-types + resolve hook）
- **SEC-002**：同卡密 20 并发（不同 request_id）→ **恰 1 条成功、1 份库存被占用、其余全 ALREADY_REDEEMED** ✅（MemRepo 模拟 DynamoDB 原子条件写）
- **FR-302**：相同 request_id 重放 → 同一兑换编号，不二次创建 ✅
- **FR-107**：已兑换卡密再提交 → ALREADY_REDEEMED，不新建交付 ✅
- **NFR-003**：无库存 → NO_STOCK，卡密保持 AVAILABLE 可恢复 ✅
- **FR-102/103**：6 态状态机映射稳定错误码（INVALID/ALREADY/DISABLED/EXPIRED/NO_STOCK）✅
- **FR-002/SEC-008**：输入白名单，注入字符/超短/非法 uuid 均 VALIDATION_ERROR ✅
- vitest 镜像测试（hmac/state-machine/validate/concurrency）已落库，全量 `npm test -w api` 与 `cdk synth` 在用户本地原生环境执行。

## G6 review 修复（2026-06-19）
- **F-101 (P1, SEC-006)**：幂等记录原存交付明文 → 改存 KMS 密文（StoredResult.deliveryCipher），幂等重放与 GET 用 `reconstructSuccess()` 按需解密。新增 vitest 回归断言（幂等记录无明文）。
- **F-102 (P1, FR-207)**：售后凭末四位查询失效（GSI1PK 用 hmac 末四位） → 卡密规范化末四位经 RedeemDeps.cardLast4 贯通，GSI1PK/masked_code 统一用之。
- **F-103 (P2, FR-105)**：库存查询去掉 `Limit:1`，避免 Filter 前置截断误判 NO_STOCK。
- node 复验：SEC-002/FR-302/F-101 全过；建议本地 `npm run test:api` 复跑确认。
