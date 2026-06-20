---
name: testing
description: 编写并运行单元/集成/E2E 测试，逐需求 ID 沉淀验收证据。当任务涉及测试编写、验收验证、覆盖率或质量门禁时使用。
---

# 测试与证据

## 层次
- 单元（Vitest）：domain 逻辑、组件渲染与状态；覆盖正常/空/错误/边界。
- 集成：handler + 本地事件 fixture；前端组件 + Mock API。
- E2E（Playwright）：关键用户路径，对照 acceptance.md。
- 视觉：交由 `visual-regression` skill。

## 规则
- 每条 MUST 需求至少一条可执行测试，测试命名引用需求 ID（如 `FR-001: ...`）。
- 修复后必须**重跑受影响测试**，禁止仅凭文本判断完成。
- 覆盖率门槛：后端 domain ≥ 80%。
- 证据（测试输出、覆盖率、报告）存 `docs/evidence/`，在验证报告中汇总。

## 验收最低状态覆盖
正常路径 / 空状态 / 加载 / 失败 / 权限 / 响应式 —— 缺一不可通过 G5。
