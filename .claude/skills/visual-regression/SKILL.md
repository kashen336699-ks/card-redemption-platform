---
name: visual-regression
description: 用 BackstopJS（或 Playwright 截图）做 UI 视觉回归测试，逐页面×断点×状态生成基线并比对像素差异。当任务涉及视觉验证、UI 回归、截图对比或前端验收时使用。
---

# 视觉回归（BackstopJS）

## 配置要点
- scenarios 覆盖 **页面 × 断点 × 状态**（desktop/tablet/mobile × loading/empty/error/default…），不只首页默认态。
- viewports 至少桌面/平板/移动三档。
- 同时截 整页、关键组件裁切图，并辅以 DOM 属性检查。

## 阈值策略
- 全局像素差阈值（如 `misMatchThreshold: 0.1`）。
- 关键区域（按钮、表单、品牌色块）**零容忍** selector 级断言。
- 定义最大修复轮数，避免反复微调无终止。

## 流程
1. `backstop reference` 生成基线：有外部设计稿则以其为准；无外部设计稿时，以 `design-prototype` 生成的 HTML+CSS 原型渲染结果作为基线参照。
2. `backstop test` 比对，超阈值产出 HTML 报告。
3. 报告与差异图存 `docs/evidence/visual/`，并关联 UX 需求 ID。
4. 独立视觉 Reviewer 据此输出 findings，Builder 定向修复。

仓库 `scaffold/tests/visual/backstop.json` 提供可运行示例配置。
