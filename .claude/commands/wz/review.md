---
description: 三类 Code Review + 安全审计，第二 AI 可配置(Claude/Codex/GPT)，输出分级 findings 与发布建议（产物 G6）
argument-hint: "[--strict] [--reviewer claude|codex|gpt]"
allowed-tools: Read, Glob, Grep, Bash(git diff:*), Bash(git log:*), Bash(npm:*), Task
---

# /wz:review — 代码与安全审查

第 6 阶段。Reviewer 独立只读审查，**不修改代码**，只输出结构化 findings。不进行无限 AI 互审。

## 第二 AI（可配置）
读 `.wz/config.json → reviewer.backend`（也可用 `--reviewer` 覆盖）：
- `claude-subagent`（默认）：派发 `reviewer` agent，独立上下文。
- `codex`：`codex review --diff <本次变更>`。
- `gpt`：经 MCP/API 调外部模型（对应原始需求"5.4 GPT 验证"）。
三者输入输出契约一致（见 reviewer agent）。

## 三种 Review
- 基础 Review：规范、类型、逻辑、错误处理、测试覆盖。
- 对抗 Review：攻击者视角、异常数据、并发、权限、资源耗尽。
- Git Diff Review：只检查本次变更对既有行为的回归风险。

## 流程
1. 收集变更：`git diff --name-only HEAD` + `git diff HEAD`（无 git 变更则对比 tasks.md 涉及文件）。
2. AI 自审 → 调用第二 AI（按 backend）独立审查 → 跑项目 **lint，`--fix` 自动修**、类型检查。
3. 按 `.wz/templates/findings.md` 输出 `docs/evidence/review/findings.json`（P0~P3）。
4. Orchestrator 把 findings 转定向修复任务回给 Builder，**最多两轮**（reviewer.max_fix_rounds）。
5. 自动修复仅限 P2/P3 且范围明确；权限/数据迁移/计费/安全策略/生产配置 → SECURITY_HOLD，不得自动合并，升级人工 Gate。
6. 剩余 P1 及以上 → 人工裁决。

## 输出与 Gate
- 产物：`docs/evidence/review/findings.json`、风险结论与发布建议（APPROVED / NEEDS_FIX / SECURITY_HOLD）。
- `G6`：无未处理 P0/P1，发布建议为 ship/fix-then-ship，人工批准记录在案。
下一步：`/wz:deploy`（需人工批准）。
