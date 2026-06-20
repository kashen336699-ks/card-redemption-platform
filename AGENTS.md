# AGENTS.md — 通用 Agent 入口（供应商无关）

本文件与 `CLAUDE.md` 等价，用于非 Claude 模型/Agent 框架。规则正文统一存放于 `.wz/rules/`，
任何 Agent 都应通过以下契约工作，避免供应商锁定。

## Agent 通用协议
1. **只加载所需上下文**：Sub-Agent 仅读取分配的 Specs、Skills 与文件范围，禁止整库加载。
2. **结构化产物**：所有输出符合 `.wz/templates/` 中的 schema（PRD、tasks、findings 等）。
3. **职责单一**：Builder 写代码并自测；Reviewer 只读 diff/specs/测试，输出 findings，不改代码；
   Orchestrator 调度任务与 Gate，不大规模写代码。
4. **可追溯**：产物引用需求 ID 与 source links；压缩摘要不得脱离原文成为新权威来源。
5. **Gate 优先**：进入阶段前检查 `.wz/state/gate.json`，未通过则停止并报告。

## 角色清单
见 `.claude/agents/`：orchestrator、frontend-builder、backend-builder、infra-builder、test-agent、reviewer。

## 记忆模型（三层）
- L1 工作记忆：当前会话 task context pack（任务 + 相关 specs + 依赖 + 文件范围 + 验证命令）。
- L2 项目记忆：`.wz/memory/`（决策索引、约束、接口、未解决问题）。
- L3 持久证据：`docs/evidence/`、`docs/decisions/`（截图、测试、Review、ADR）。
会话结束写 `.wz/memory/handoff.md`：已完成 / 未完成 / 验证结果 / 下一步。
