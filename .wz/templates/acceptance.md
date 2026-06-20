---
id: SPEC-ACCEPT
version: 1.0
status: draft
owner: tech-lead
updated_at: 2026-01-01
source_ids: []
---

# 验收标准（acceptance.md）

## 验收矩阵（每条对应需求 ID + 可执行测试）
| 需求 ID | 验收条件（可执行） | 测试类型 | 测试位置 | 证据路径 |
|---|---|---|---|---|
| FR-001 | 给定…当…则… | e2e | tests/e2e/login.spec.ts | docs/evidence/... |
| UX-001 | 三断点像素差 < 阈值 | visual | tests/visual | docs/evidence/visual/ |
| SEC-001 | 未认证返回 401 | integration | services/api/test | - |

## 每功能最低状态覆盖
正常路径 / 空状态 / 加载 / 失败 / 权限 / 响应式 —— 缺一不可通过 G5。
