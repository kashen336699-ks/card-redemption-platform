# 开发计划索引（PLAN.md）

> `/wz:prd` / `/wz:plan` 维护。`/wz:ai` 据此决定 feature 顺序与 feature 间串联。

## 本次切分（{YYYY-MM-DD}）共 N 个 feature
| 序号 | feature | 说明 | 依赖 | 状态 |
|---|---|---|---|---|
| 1 | {feature-1} | {一句话} | - | 待开发 |
| 2 | {feature-2} | {一句话} | 1 | 待开发 |

**推荐执行顺序**：1 → 2 →（无依赖的可并行）

## ID 编号约定
- 需求 / 任务 / 验收 ID 在单个 feature 内编号；跨 feature 加 `{序号}.` 前缀。
- 例：`2.T-001` = 序号 2 的 T-001；跨 feature 依赖写全限定 `3.T-001 依赖 2.T-004`。

## feature 目录映射
- `docs/specs/features/1.{feature-1}/` → design.md + tasks.md
- 全局 spec（项目级）：`docs/specs/product.md`、`architecture.md`、`acceptance.md`
