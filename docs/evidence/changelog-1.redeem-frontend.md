# Changelog — 1.redeem-frontend（G4）

- 日期：2026-06-19
- 关联需求：FR-001~010、UX-001/002/003

## 变更摘要
- Tailwind theme：从 `design/tokens.css` 注入颜色/圆角/阴影/字体（禁 magic values，UX-003）。
- `api/`：`normalize.ts`（FR-001 规范化 + FR-002 校验）、`client.ts`（httpApi，卡密只走请求体 SEC-003，状态码→outcome 分类）、`mock.ts`（契约冻结后并行的 Mock Server，按卡密前缀返回 7 类结果）。
- `pages/RedeemHome.tsx`：还原原型首页——输入/粘贴规范化、前端即时校验、按钮 default/loading/disabled 状态机（FR-003 加载禁重复提交）、Enter 提交、aria-invalid/role=alert。
- `pages/RedeemResult.tsx`：成功/失败共用卡片骨架；成功展示商品/规格/兑换编号 + 按 delivery_type 渲染交付 + 一键复制（FR-005/006/007）；失败展示稳定错误文案 + 售后入口常驻（FR-008/009）。
- `components/`：BrandHeader、SubmitButton（状态机 + focus-visible 焦点环）。
- `App.tsx`：home→success/error 视图切换（轻量 SPA）。
- `tests/visual/backstop.json`：5 场景 × 390/1440 两视口，以 design-prototype HTML 为 reference 基线（UX-001）。

## 验证（node --experimental-strip-types）
- FR-001/002：`normalizeCode` 去空格/分隔符/统一大写；`validateCode` 空值/过短/非法字符提示，合法通过 ✅
- 错误文案统一引用共享 `ERROR_CATALOG`（前后端一致，FR-008 稳定文案）。
- 组件测试 `RedeemHome.test.tsx`（label 可达、空值不调用 API、成功触发 onSuccess）+ `npm run build`/`test:visual` 在用户本地原生环境执行。
- 像素级真值：`docs/specs/features/1.redeem-frontend/design/*.html` 原型；React 按 tokens 类对类还原。
