# ADR-0001 — MVP 关键架构决策

- 日期：2026-06-19
- 阶段：G1 / prd 人工裁决
- 状态：accepted

## 背景
PRD V1.0 未指定存储、密钥托管、后台认证、保留期与 MVP-1 发布范围。这些直接决定 G2 架构与 OpenAPI 契约，需人工裁决方可冻结。

## 决策
| 编号 | 主题 | 决策 | 关联需求 |
|---|---|---|---|
| D1 | 数据库 | DynamoDB；条件更新 + TransactWriteItems 保证幂等与原子 | SEC-002, FR-106, FR-302 |
| D2 | 保留期 | 审计/兑换记录 90 天，DynamoDB TTL 自动清理 | FR-301, FR-303, SEC-007 |
| D3 | 后台认证 | MVP 单管理员 + 简单口令/基本认证；RBAC 后置 | SEC-009 |
| D4 | 密钥托管 | AWS KMS（字段加密）+ Secrets Manager（HMAC 密钥），与 DB 分离 | SEC-001, SEC-006 |
| D5 | 发布范围 | MVP-1 = 前台三页 + 兑换 API；管理后台进 MVP-2 | §13 里程碑 |

## 结果
- feature 优先级：1.redeem-frontend → 2.redeem-api → 3.data-security → 6.security-hardening → 4.audit-observability（MVP-1）；5.admin-support 进 MVP-2。
- DynamoDB 单表/多表建模、TransactWriteItems 幂等语义在 architecture.md 细化。
- 卡密/商品 MVP-1 用导入脚本，无后台 UI。

## 备选与未采纳
- RDS/PostgreSQL：SQL 事务直观，但 Lambda 下连接池/RDS Proxy 运维更重，MVP 不采用。
- 环境变量存密钥：隔离性弱，不满足 SEC-006，不采用。
