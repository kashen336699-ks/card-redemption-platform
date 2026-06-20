---
description: 初始化 WZ 工作流：检测/初始化 git、分析仓库、补齐目录、生成规则入口与环境报告（产物 G0）
argument-hint: "[--dry-run] [--strict] [--git-init] [--no-git]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(git:*), Bash(ls:*), Bash(cat:*)
---

# /wz:init — 初始化与规则架构

你正在执行流水线的第 0 阶段。**禁止生成任何业务代码。** 只做 git 检测、仓库画像与脚手架。

## 前置条件
- 在项目根目录运行；如已存在 `.wz/state/gate.json` 则进入增量模式，不覆盖用户已有配置。

## 执行步骤

### 0. Git 仓库检测与初始化（最先做）
1. 运行 `git rev-parse --is-inside-work-tree 2>/dev/null` 判断当前目录是否已在 git 仓库内。
2. **已是 git 仓库** → 保持现状，不动用户的 git 配置/历史；用 `git status` 记录当前分支与是否干净，写入 init-report。
3. **不是 git 仓库** → **询问用户是否初始化**（除非传了 `--git-init` 直接初始化、或 `--no-git` 跳过）：
   - 用户同意 → `git init`，并在缺失时生成一份基础 `.gitignore`（含 `node_modules/`、`dist/`、`.env*`、`cdk.out/`、`.wz/state/*.local`），**不自动 commit**（首个提交交给用户或后续阶段）。
   - 用户拒绝 / `--no-git` → 跳过，但在 init-report 标 `ASSUMPTION: 无版本控制`，并提示后续 `/wz:ai` 的小步提交、`/wz:review` 的 diff 审查、`/wz:deploy` 的 commit 记录都依赖 git，建议尽早 init。
4. `--dry-run` 时只报告将执行的 git 动作，不实际 `git init`。

> 说明：本步用内置 `git` 命令即可，无需额外 git MCP；如果你的环境装了 git MCP 也可用，但不是必需。

### 1. 分析项目
检测仓库状态、语言、框架、包管理器、测试、构建与 IaC 工具，写 `.wz/memory/repo-profile.json`。

### 2. 补齐目录
创建或补齐 `.wz/`（含 `config.json`、`memory/lessons.md`）、`docs/specs`（含 `PLAN.md` 与 `features/` 目录）、`docs/contracts`、`docs/decisions`、`docs/evidence`、`tests/` 结构（缺什么补什么）。

### 3. 生成入口
从 `.wz/rules/` 模板生成/校验 `CLAUDE.md` 与 `AGENTS.md` 轻量入口（只声明优先级/必读/禁止，不复制规则正文）。

### 4. 环境检查
检查 git、MCP、AWS 凭证、浏览器、视觉测试工具与模型能力 —— **仅报告，不静默安装**。

### 5. 出报告与 Gate
输出 `docs/evidence/init-report.md`（含 git 状态），并写 `.wz/state/gate.json` 的 G0。

## 输出与 Gate
- 产物：git 仓库（如新建）、repo-profile.json、目录结构、入口文件、init-report.md。
- `G0` 判定：git 状态明确（已有/新建/用户显式跳过）、目录与入口齐备且无未豁免 BLOCKER → `passed`，否则 `failed` 并列出 blockers。
- 任何 BLOCKER（缺 AWS 凭证、缺包管理器等）必须在进入 `/wz:prd` 前解决或人工 `waived`。

## 禁止
- 不写业务代码；不覆盖用户已有 CLAUDE.md 的自定义段落；不静默安装依赖；未经同意不 `git init`、不自动 commit、不改用户已有 git 配置。

完成后写 `.wz/state/run.json`，并提示下一步：`/wz:prd`。
