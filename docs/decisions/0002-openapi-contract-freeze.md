# ADR-0002 — OpenAPI 契约冻结 + 设计源

- 日期：2026-06-19
- 阶段：G2 / design
- 状态：accepted（contract FROZEN）

## 决策
1. **冻结 `docs/contracts/openapi.yaml`**（v1.0.0）。三接口：`POST /redemptions`、`GET /redemptions/{id}`、`POST /support/lookup`。状态码与 7 类业务错误码（+NOT_FOUND/VALIDATION_ERROR）定义完毕，通过 openapi-spec-validator。冻结后前后端按此并行；任何字段变更须经 `/wz:prd --change` 走变更流程，不得私加（项目规则 L2）。
2. **设计源**：无外部设计稿，采用 `design-prototype` 生成的 HTML+CSS 原型（`docs/specs/features/1.redeem-frontend/design/`）作为前端像素级还原源与 `/wz:verify` 视觉回归基线。

## 契约要点（安全对齐）
- 卡密仅经请求体传输，禁止 URL Query（SEC-003）。
- 响应不含内部库存 ID / 卡密明文 / DB 错误 / 风控阈值（SEC-004）。
- `request_id` 幂等（FR-302）；429 带 Retry-After（SEC-005）；500 语义"未消耗卡密"（NFR-003）。
- 交付链接用短时签名 URL（SEC-010）。

## 影响
- 后端 redeem-api 按 schema 实现 handler/domain/repository；前端按 schema 定义 TS 类型与 API client。
- G3/plan 据此拆任务，G5/verify 用契约做接口对照。
