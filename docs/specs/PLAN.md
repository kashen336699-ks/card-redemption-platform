# 开发计划索引（PLAN.md）

> `/wz:prd` / `/wz:plan` 维护。`/wz:ai` 据此决定 feature 顺序与 feature 间串联。
> 依据 ADR-0001（DynamoDB/KMS/单管理员/90天TTL/MVP-1 仅前台+兑换API）与 ADR-0002（契约冻结）。

## 本次切分（2026-06-19）共 7 个 feature（MVP-1 六个 + MVP-2 一个）
| 序号 | feature | 说明 | 含需求(ID) | 预估任务 | 依赖 | 状态 |
|---|---|---|---|---|---|---|
| 0 | scaffold | monorepo + CDK 骨架 + 契约 TS 类型 | NFR-006 | 5 | - | 待开发 |
| 3 | data-security | HMAC 索引 + KMS 字段加密 + 密钥托管 | SEC-001/006 | 5 | 0 | 待开发 |
| 2 | redeem-api | 兑换校验/状态机/事务幂等/轮询/售后接口 | FR-004,101–107,207,302; SEC-002; NFR-003 | 8 | 0,3 | 待开发 |
| 1 | redeem-frontend | 兑换首页/成功/失败前台 + API client | FR-001–010; UX-001/002/003 | 8 | 0（契约冻结后与 2 并行，用 Mock） | 待开发 |
| 6 | security-hardening | 限流/防枚举/HTTPS/CSP/CSRF/安全冒烟 | SEC-003/004/005/008 | 5 | 2 | 待开发 |
| 4 | audit-observability | 审计日志/结构化日志/指标/埋点 | FR-301/303; NFR-005/006; SEC-007 | 5 | 2 | 待开发 |
| 5 | admin-support | 管理后台 + 售后人工处理（**MVP-2**） | FR-201–206; SEC-009 | 待 MVP-2 规划 | 2,3 | 推迟 MVP-2 |

**推荐执行顺序**：0 → 3 → 2 →（1 与 2 在契约冻结后可并行，前端用 Mock Server）→ 6 → 4。5 进入 MVP-2。

## 并行/串行规则（L1 lambda + plan 规则）
- 契约已冻结（ADR-0002）→ 前端（1）用 Mock Server，后端（2）按同一 OpenAPI 实现，可并行。
- 安全审查（6）、最终集成、并发测试必须**串行**，置于 2 之后。
- 0.scaffold 是所有 feature 的前置，必须最先完成。

## ID 编号约定
- 需求 / 任务 / 验收 ID 在单个 feature 内编号；跨 feature 加 `{序号}.` 前缀。
- 例：`2.T-001` = 序号 2 的 T-001；跨 feature 依赖写全限定 `2.T-002 依赖 3.T-001`。

## feature 目录映射
- `docs/specs/features/0.scaffold/` → tasks.md（design 见 architecture.md）
- `docs/specs/features/1.redeem-frontend/` → design.md（已有）+ tasks.md
- `docs/specs/features/2.redeem-api/` → design.md（指向 architecture.md）+ tasks.md
- `docs/specs/features/3.data-security/` → tasks.md
- `docs/specs/features/4.audit-observability/` → tasks.md
- `docs/specs/features/6.security-hardening/` → tasks.md
- `docs/specs/features/5.admin-support/` → MVP-2 规划时生成
- 全局 spec（项目级）：`docs/specs/product.md`、`architecture.md`、`acceptance.md`

## 里程碑映射（PRD §13）
- MVP-1 = feature 0,3,2,1,6,4（数据结构/兑换API/前台/安全/审计）。
- MVP-2 = feature 5（管理后台/售后/审计后台）+ 监控告警完善。
- V1.1 = 订单二次校验、自动发卡、验证码与更细风控（PRD 非目标，后续）。
