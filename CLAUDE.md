# CLAUDE.md — WZ AI 全栈研发工作流入口

> 本文件是 Claude 在本仓库工作的**唯一入口**。它只声明优先级、必读文件与禁止事项，
> 不复制规则正文，以避免提示词膨胀并保持模型可移植性（详见 AGENTS.md）。

## 1. 你是谁
你在一条**阶段门禁流水线**中工作。每个阶段有明确的输入、输出、验收条件与责任 Agent。
你不得跳过 Gate，不得超出当前任务声明的文件范围，不得静默补全关键决策。

## 2. 规则优先级（高 → 低，冲突时上层覆盖下层）
1. L0 组织规则 → `.wz/rules/org.md`
2. L1 技术栈规则 → `.wz/rules/react.md`、`.wz/rules/lambda.md`
3. L2 项目规则 → `.wz/rules/project.md`
4. L3 任务规则 → 当前 feature 的 `tasks.md` 中该任务的 constraints（文件范围/验证/证据）

## 3. 进入任何阶段前必读
- 当前阶段命令：`.claude/commands/wz/<stage>.md`
- Gate 状态：`.wz/state/gate.json`；工作流配置：`.wz/config.json`
- 计划索引：`docs/specs/PLAN.md`（feature 顺序与依赖）
- 全局规格：`docs/specs/product.md`、`architecture.md`、`acceptance.md`
- 当前 feature 规格：`docs/specs/features/{N}.{name}/{design.md,tasks.md}`（只加载相关，不整库读入）
- 记忆：`.wz/memory/lessons.md`（踩坑/决策，每个 task 开工前必读）
- API 契约（涉及集成时）：`docs/contracts/openapi.yaml`

## 4. 硬性禁止事项
- ❌ 未通过上一阶段 Gate 就进入下一阶段
- ❌ 在 `/wz:verify`、`/wz:review` 阶段直接修改实现代码（只产出 findings）
- ❌ 无 OpenAPI 契约冻结就并行编写前后端最终集成代码
- ❌ 把静态前端或长耗时 AI 任务直接塞进同步 Lambda
- ❌ 在控制台手工改基础设施（必须走 CDK）
- ❌ 自动合并涉及权限、数据迁移、计费、安全策略、生产配置的修复

## 5. 关键约定
- 每条可执行需求有唯一 ID（FR-/NFR-/UX-/SEC-），贯穿 spec → task → code → test；跨 feature 加 `{序号}.` 前缀。
- 需求强度用 MUST / SHOULD / MAY；禁止"尽量""适当""大概"等不可验收措辞。
- 任务 = 需求 × 层 的最小可验证切片；单 task ≤30min（5/15/30）；单 feature 4–8 任务。
- 断点标记：`[ ]/[x]/[CHANGED]/[DROPPED]/[NEW]`；每完成一个 task 立即标 `[x]`。
- 任何假设标 `ASSUMPTION`，任何阻塞标 `BLOCKER`，交人工裁决，不静默处理。
- 命令完成后写 `.wz/state/run.json` 与对应 `gate.json`。

## 6. 执行循环与上下文纪律（/wz:ai）
- 按 N0–N7 节点状态机逐 task 推进，严禁跳过节点，每节点结束输出确认行。
- 双 AI：Builder 自审 + 第二 AI（`.wz/config.json → reviewer.backend`：claude-subagent/codex/gpt）独立审查。
- 上下文：每个 task 完成后 `/clear` 重载 context pack；执行中 ~80% 时 `/compact`；`lessons.md` 每次重读。

## 7. 命令索引
`/wz:init → /wz:prd → /wz:design → /wz:plan → /wz:ai → /wz:verify → /wz:review → /wz:deploy → /wz:observe`
`/wz:prd --change <N>.<feature> <描述>` 用于需求变更。
