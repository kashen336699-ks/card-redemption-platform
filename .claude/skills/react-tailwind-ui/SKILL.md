---
name: react-tailwind-ui
description: 将 HTML+CSS / Figma / 截图设计稿像素级还原为 React + Tailwind 组件。当任务涉及前端 UI 实现、设计稿还原、组件构建、响应式或交互动画时使用。
---

# React + Tailwind 像素级还原

## 目标
高完整度还原设计稿，而非"看起来差不多"。完整度的关键在 **状态矩阵 + tokens + 结构先行 + 多粒度验证**。

## 流水线（必须按序）
1. **设计源解析**：读取设计源——外部 HTML+CSS / Figma / 截图，**或由 `design-prototype` skill 生成的 `docs/specs/features/{N}/design/*.html` 原型**——建立 页面、组件、状态、断点 清单。无任何设计源时才退化为按 design.md 自行设计（无像素级真值）。
2. **Token 提取**：颜色、字体、字号、间距、圆角、阴影、层级 → 映射 `tailwind.config` theme。禁止散落 magic values。
3. **结构实现**：先构建语义化 React 组件树与布局策略，再映射 Tailwind 实用类；**不**从截图直接写绝对定位。
4. **交互实现**：用状态机覆盖 loading / empty / error / disabled / hover / focus / modal / 动画；动态效果用 React 状态与生命周期实现。
5. **页面矩阵验证**：逐 页面 × 断点 × 状态 生成基线截图，不只验证首页默认态。
6. **视觉回归**：调用 `visual-regression` skill，像素差超阈值生成报告。
7. **双 AI 验证**：独立视觉 Reviewer 根据 截图 + DOM + design tokens 输出 findings，Builder 定向修复。

## 还原硬要求（用户原始约束）
① 注意组件结构与层次，还原布局与样式；② 用 Tailwind 实用类保证一致性与可维护性；
③ 注意细节与交互效果，确保体验与设计稿一致；④ 动态交互/动画用 React 状态管理与生命周期实现。

## 完整度不足的常见原因与修正
| 问题 | 原因 | 修正 |
|---|---|---|
| 只还原默认页 | 缺状态矩阵 | design.md 强制列 页面×断点×状态 |
| 视觉像但结构差 | 截图直写绝对定位 | 先产组件树+布局策略再编码 |
| Tailwind 类失控 | 无 token/组件约束 | 先生成 theme tokens，禁重复 magic values |
| 验证过但细节漏 | 只看整页缩略图 | 同时查整页、组件裁切图、DOM 属性 |
| 反复微调不终止 | 无差异阈值 | 定义像素差、关键区零容忍、最大修复轮数 |

## UI 验收最低项
布局/对齐/间距/字体/颜色/圆角/阴影对齐 tokens；三断点无溢出遮挡；
loading/empty/error/disabled/长文本/极端数据有设计与测试；
键盘导航/焦点态/label/对比度/reduced-motion 达标；视觉报告存 docs/evidence/visual 并关联 UX 需求 ID。
