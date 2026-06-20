---
description: 独立验证功能/视觉/接口/安全/可部署性；含 QA 动态触发评分（产物 G5）
argument-hint: "[--scope <module>] [--strict]"
allowed-tools: Read, Glob, Grep, Bash, Task
---

# /wz:verify — 独立验证

第 5 阶段。用**独立上下文**验证，不直接重写实现（发现问题回退给 /wz:ai）。可由 `/wz:ai` 的 N5 节点按需触发其子集。

## QA 动态触发评分（决定跑全量还是轻量）
按 `.wz/config.json → qa`。四维各 1–5 分，**总分 ≥ 8 触发全量 QA**：

| 维度 | 1 分 | 5 分 |
|---|---|---|
| 变更范围 | 单文件小改 | 跨多模块/多项目 |
| 风险等级 | 纯 UI 文案 | 数据库/支付/认证 |
| 累积变更 | 上次 QA 后 1 个 task | 上次 QA 后 5+ 个 task |
| 功能边界 | 模块内部实现 | 完整用户可感知功能 |

**必触发（无需打分）**：feature 全部完成 / API 变更 / 数据库 migration / 认证授权计费 / 连续 5 task 未 QA。
**可跳过**：纯文档注释配置 / 仅新增类型定义 / 上一 task 刚 QA 且本次变更极小。

## 验证维度
1. 功能：按 acceptance.md 跑单元/集成/E2E，逐需求 ID 记录通过情况。
2. 视觉：用 `visual-regression` skill 逐页面×断点×状态跑 BackstopJS；像素差超阈值出报告；同时查整页、组件裁切图与 DOM 属性。
3. 接口：实际请求对照 OpenAPI 契约校验请求/响应/错误码。
4. 安全：基础越权/未认证/异常数据冒烟。
5. 可部署性：`cdk synth` 能否通过、无明显资源/权限问题。

## 输出与 Gate
- 产物：`docs/evidence/verify-report.md`、视觉报告（docs/evidence/visual）。
- `G5`：所有 MUST 需求验证通过、视觉差异在阈值内、契约一致。不通过 → 回 `/wz:ai`；QA 最多 3 轮（qa.max_qa_rounds）。
下一步：`/wz:review`。
