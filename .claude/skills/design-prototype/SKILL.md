---
name: design-prototype
description: 从 PRD / design.md 生成 HTML+CSS 设计稿原型（含 design tokens），作为前端像素级还原的源与视觉回归基线。当没有外部设计稿（Figma/截图）、需要先把需求落成可视化设计稿时使用。
---

# design-prototype — PRD → HTML+CSS 设计稿

当**没有外部设计稿**时，先把 PRD 与 design.md 落成一份**静态 HTML+CSS 原型稿**。
这份原型同时充当两个角色：前端 React 还原的**源设计稿**、`/wz:verify` 视觉回归的**基线参照**。
这样即使没有 Figma/截图，也能走完整的"还原 + 像素级验证"闭环。

## 何时用
- 用户没有设计稿链接，或链接不完整/缺页面。
- 在 `/wz:design` 阶段，外部设计稿优先；缺失时调用本 skill 生成。

## 输入
- `docs/specs/product.md`（功能、用户故事、UX 需求 ID）
- 当前 feature 的 `design.md`（页面×断点×状态矩阵、design tokens、组件树）

## 工作流程
1. **先定 tokens**：把 design.md 的 design tokens 写成 `tokens.css`（CSS 变量：颜色、字体、字号、间距、圆角、阴影、层级）。颜色/间距等只在此处定义，原型里不散落 magic values。
2. **逐页面生成 HTML+CSS**：按状态矩阵，每个页面一份 `*.html`，引用 `tokens.css`：
   - 语义化结构（header/main/form/button…），不堆无意义 div。
   - 覆盖关键状态：default / loading / empty / error / disabled（用 `?state=` 查询参数或多份文件区分，便于 backstop 逐态截图）。
   - 三断点自适应（桌面/平板/移动），用媒体查询或 flex/grid。
3. **可访问性占位**：表单 label、focus 可见、对比度达标、`prefers-reduced-motion`。
4. **标注来源**：每份原型顶部注释关联的 UX 需求 ID 与页面名。

## 输出位置（约定）
```
docs/specs/features/{N}.{name}/design/
├── tokens.css          # design tokens（CSS 变量）
├── {page}.html         # 各页面原型（default 态）
└── {page}.error.html   # 关键状态变体（按需）
```
并在 `design.md` 的「设计源」一节登记这些文件路径，标明「由 design-prototype 生成（无外部设计稿）」。

## 与下游衔接
- **还原**：`react-tailwind-ui` skill 以这些 HTML+CSS 为源设计稿，提取 tokens → Tailwind theme，再建语义化 React 组件树还原。
- **视觉回归**：`visual-regression` skill 用原型渲染结果作为 backstop reference 基线；React 实现作为 test，逐页面×断点×状态比对像素差。

## 边界
- 原型是**设计稿**，不是最终前端代码：纯 HTML+CSS、不写业务逻辑、不接 API。
- 涉及品牌视觉强主张（具体插画、特殊视觉风格）时，原型给出合理默认并标注 `ASSUMPTION`，建议人工确认或补外部设计稿。
