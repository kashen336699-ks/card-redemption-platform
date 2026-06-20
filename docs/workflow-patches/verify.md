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
2. **构建与类型（强制，独立于单测）**：跑 `npm run build`（含 `tsc -b` 严格类型检查）与 `npm run typecheck`。**vitest/esbuild 绿不等于 build 绿**——esbuild 转译不做完整类型检查，`import.meta.env` 未声明、判别联合交叉成 never、缺失 .d.ts 等只有 `tsc` 会暴露。前端构建须带真实/占位 `VITE_*` 环境变量。任一不过即 G5 失败，回 `/wz:ai`。
3. 视觉：用 `visual-regression` skill 逐页面×断点×状态跑 BackstopJS；像素差超阈值出报告；同时查整页、组件裁切图与 DOM 属性。
4. 接口：实际请求对照 OpenAPI 契约校验请求/响应/错误码。**跨域场景**额外验证 CORS 预检（OPTIONS）通过、响应含 `Access-Control-Allow-*`（前端在 CloudFront、API 在 execute-api 等不同源时必查）。
5. 安全：基础越权/未认证/异常数据冒烟。
6. 可部署性：`cdk synth` 能否通过、无明显资源/权限问题。

## 输出与 Gate
- 产物：`docs/evidence/verify-report.md`、视觉报告（docs/evidence/visual）。
- `G5`：所有 MUST 需求验证通过、**构建与类型检查通过**、视觉差异在阈值内、契约一致（含跨域 CORS）。不通过 → 回 `/wz:ai`；QA 最多 3 轮（qa.max_qa_rounds）。
下一步：`/wz:review`。
