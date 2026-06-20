---
id: SPEC-DESIGN-2
version: 1.0
status: draft
owner: architect
updated_at: 2026-06-19
source_ids: [SRC-001]
feature: "2.redeem-api"
---

# 设计规格（design.md）— 2.redeem-api

本 feature 的架构设计承自全局 `docs/specs/architecture.md`，此处只记 feature 级要点：

- **分层**（L1 lambda）：handler（协议适配）/ domain（用例+状态机+幂等，纯函数）/ repository（DynamoDB 访问）。
- **契约**：实现冻结的 `docs/contracts/openapi.yaml`（ADR-0002），3 接口、7 错误码。
- **原子性**：单次 `TransactWriteItems`（卡密条件更新 AVAILABLE→REDEEMED + 库存锁定 + 兑换记录 Put + 幂等键 Put），任一条件失败整体回滚（SEC-002/FR-106/NFR-003）。详见 architecture.md「兑换原子性」。
- **状态机**：AVAILABLE/PROCESSING/REDEEMED/EXPIRED/DISABLED/NO_STOCK，映射 7 错误码（FR-102/008）。
- **依赖**：3.data-security 的 HMAC（卡密查询）与 KMS（交付内容解密）。

错误码 ↔ HTTP 映射见 openapi.yaml；不在此重复。
