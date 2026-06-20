---
description: 切分 feature、拆任务（需求×层最小切片）、建依赖图与 PLAN.md 索引、分配 Agent（产物 G3）
argument-hint: "[--scope <module>]"
allowed-tools: Read, Write, Edit, Glob, Grep
---

# /wz:plan — 任务编排

第 3 阶段。把设计拆成**可独立验证的小任务**，并按 feature 组织。不创建无验收标准的任务。

## Step 1：feature 切分（一等步骤，先于建目录）
把功能目标按「高内聚、可独立交付」切成 N 个 feature，每个满足：任务数 **4–8 个**、彼此依赖最少、围绕一个清晰功能闭环（如"登录""注册"分开，而非塞进 `user-auth`）。
- 预估任务数 ≤8 → 1 个 feature；>8 → 必须拆多个，禁止硬塞。
- 输出切分表：`| feature(kebab) | 含功能需求(ID) | 预估任务数 | 依赖 |`。

## Step 2：生成/更新 PLAN.md 索引
写 `docs/specs/PLAN.md`（模板见 `.wz/templates/PLAN.md`）：feature 列表、执行顺序、依赖、状态。
**ID 约定**：需求/任务/验收 ID 在单 feature 内编号，跨 feature 加 `{序号}.` 前缀（如 `2.T-001`；`3.T-001 依赖 2.T-004`）。

## Step 3：逐 feature 生成 design.md + tasks.md
在 `docs/specs/features/{N}.{name}/` 下，用 `.wz/templates/design.md`、`.wz/templates/tasks.md` 各生成一份。全局 `product.md/architecture.md/acceptance.md` 不动（项目级 spec）。

## 任务拆分纪律（强制）
- **task = 需求 × 层 的最小可验证切片**，不是"一个完整功能"。一个功能横跨前端/后端/DB/IaC，按层切成多个可独立验证的 task。
- **单 task 估时 ≤30min**，只能取 `5min / 15min / 30min`；超 30min 必须继续拆。
- **单 feature 4–8 个任务**；生成前先数，超 8 → 回 Step 1 重切（再拆一个 feature 并更新 PLAN.md），禁止硬塞、禁止为压数虚低估时。
- 每个 task 必须声明：需求 ID、依赖、**允许修改的文件范围**、验证命令、证据路径、负责 Agent。
- 断点标记位预留：`[ ]` 未完成 / `[x]` 完成 / `[CHANGED]` / `[DROPPED]` / `[NEW]`。

> ⛔ 反例：`T-001 实现登录功能 ~30min`（横跨前后端+DB，估时虚低、不可独立验证）。
> ✅ 正例：拆成「登录接口」「登录表单」「session 持久化」三个切片，各自可验证。

## 并行/串行规则
- 契约冻结前，前后端不得并行写最终集成代码；冻结后前端用 Mock Server、后端按同一 OpenAPI 实现。
- 安全审查、数据库迁移、最终集成必须**串行**。
- 无依赖且分属不同项目/文件 → 可并行（N2 派发 subagent）。

## 输出与 Gate
- 产物：`docs/specs/PLAN.md`、各 `features/{N}.{name}/{design.md,tasks.md}`、依赖图、Agent 分配。
- `G3`：每个 task 有验收标准/文件范围/验证命令/估时≤30min；单 feature ≤8 任务；依赖无环。
下一步：`/wz:ai`。
