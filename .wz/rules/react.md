# L1 技术栈规则 — React + Tailwind 前端

## 框架与依赖
- React 18 + TypeScript + Vite + Tailwind CSS。
- 状态优先用组件内 `useState`/`useReducer`；跨组件用 Context 或轻量 store，不默认引入 Redux。
- 禁止使用 `localStorage`/`sessionStorage` 之外未声明的浏览器存储；持久化需在 design.md 说明。

## 设计还原（像素级）
1. 先从 HTML+CSS / Figma / 截图提取 **design tokens**（颜色、字体、字号、间距、圆角、阴影、层级）→ 映射 Tailwind theme，禁止散落 magic values。
2. 先建**语义化组件树**与布局策略，再映射 Tailwind 类；不从截图直接写绝对定位。
3. 按状态机实现 loading / empty / error / disabled / hover / focus / modal / 动画。
4. 逐页面 × 断点 × 状态 生成基线截图，不只验证首页默认态。
5. 视觉回归用 BackstopJS；像素差超阈值生成报告并关联 UX 需求 ID。

## 可访问性（最低项）
键盘导航、可见焦点态、表单 label、对比度、`prefers-reduced-motion` 必须满足。

## 测试
- 组件单测（Vitest + Testing Library）覆盖正常/空/错误/边界态。
- 视觉证据保存到 `docs/evidence/visual/` 并在 PR 引用。
