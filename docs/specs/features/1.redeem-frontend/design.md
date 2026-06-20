---
id: SPEC-DESIGN-1
version: 1.0
status: draft
owner: design
updated_at: 2026-06-19
source_ids: [SRC-001]
feature: 1.redeem-frontend
---

# 设计规格（design.md）— 1.redeem-frontend

## 设计源
- **由 `design-prototype` 生成（无外部设计稿）**，路径：`docs/specs/features/1.redeem-frontend/design/`
  - `tokens.css` — design tokens（CSS 变量）
  - `redeem-home.html` — 兑换首页（含 default / loading / disabled，响应式 390/1440）
  - `redeem-success.html` — 兑换成功页
  - `redeem-error.html` — 兑换失败页（参数化 7 类错误码文案）
- 视觉系统依据 PRD §14：深色科技感、紫色主品牌、青绿安全/成功色、Noto Sans SC、圆角卡片、明确状态反馈。
- `ASSUMPTION`：无品牌 LOGO/插画素材，原型用文字品牌位 + 几何装饰占位，建议后续补外部视觉。

## 页面 × 断点 × 状态矩阵（强制）
| 页面 | UX-ID | 桌面1440 | 移动390 | loading | empty | error | disabled |
|---|---|---|---|---|---|---|---|
| 兑换首页 | UX-001, UX-002, UX-003 | ✓ | ✓ | ✓（按钮加载、防重复提交 FR-003） | n/a | ✓（前端校验提示 FR-002） | ✓（空值/加载时禁用） |
| 兑换成功 | UX-001, UX-002, UX-003 | ✓ | ✓ | n/a | n/a | n/a | n/a |
| 兑换失败 | UX-001, UX-002, UX-003 | ✓ | ✓ | n/a | n/a | ✓（7 类错误码文案 FR-008） | n/a |

- **UX-001（响应式）**：三页均覆盖 1440 桌面与 390 移动，无横向滚动/遮挡/截断。
- **UX-002（无障碍）**：见下「可访问性清单」——label/键盘/对比度/reduced-motion。
- **UX-003（视觉系统）**：见下「Design Tokens」——深色科技感、紫主色 #7C3AED、青绿安全色 #2DD4BF、Noto Sans SC、圆角卡片、明确状态反馈。

> 处理中态（PROCESSING/轮询 FR-010）复用首页 loading 视觉 + 轮询提示；成功/失败页共用同一卡片骨架（PRD 开发提示：失败态替换图标/标题/说明/主操作）。

## Design Tokens
| token | 值 | Tailwind 映射 |
|---|---|---|
| color.bg.base | #0B0B14 | `bg-base` |
| color.bg.elevated | #14152233 → 卡片 #1A1B2E | `bg-card` |
| color.primary | #7C3AED（紫） | `primary` |
| color.primary.hover | #6D28D9 | `primary-hover` |
| color.safe | #2DD4BF（青绿，安全/成功） | `safe` |
| color.danger | #F87171 | `danger` |
| color.warning | #FBBF24 | `warning` |
| color.text.primary | #F4F4FB | `text-primary` |
| color.text.muted | #9A9AB8 | `text-muted` |
| color.border | #2A2B45 | `border-base` |
| font.family | "Noto Sans SC", system-ui, sans-serif | `font-sans` |
| radius.card | 16px | `rounded-2xl` |
| radius.input | 12px | `rounded-xl` |
| shadow.card | 0 8px 40px rgba(124,58,237,.18) | `shadow-card` |
| space.page | 24px / 桌面 48px | `p-6` / `lg:p-12` |

## 组件树
```
<App>
 ├─ <BrandHeader>            品牌名 + 价值标语
 ├─ <RedeemHome>
 │   ├─ <ValueProps>         三条价值说明（低门槛/强确定/高安全）
 │   ├─ <RedeemCard>
 │   │   ├─ <CodeInput>      label + 输入/粘贴 + 即时校验提示（FR-001/002）
 │   │   ├─ <SubmitButton>   default/hover/loading/disabled（FR-003）
 │   │   └─ <SecurityHint>   安全提示文案
 │   └─ <StepsGuide>         兑换步骤
 ├─ <RedeemResult variant="success|error">   共用卡片骨架
 │   ├─ <StatusIcon>         ✓ 青绿 / ✕ 红
 │   ├─ <ProductBlock>       商品名/有效期/规格（成功）
 │   ├─ <DeliveryBlock>      按 delivery_type 渲染 + 一键复制（FR-006/007）
 │   ├─ <RedemptionId>       兑换编号（FR-005）
 │   ├─ <ErrorMessage>       7 类稳定文案（FR-008）
 │   └─ <SupportEntry>       售后入口（FR-009，失败页常驻）
 └─ <Footer>                 安全提醒 / 返回首页
```

## 交互与动画
| 元素 | 触发 | 状态变化 | reduced-motion 回退 |
|---|---|---|---|
| SubmitButton | 点击 | default→loading（spinner，禁用重复点击） | 去除 spinner 旋转，仅文字"处理中" |
| CodeInput | 输入/失焦 | 即时校验提示淡入 | 无淡入，直接显示 |
| RedeemCard | 进入 | 轻微上浮淡入 | 无动画 |
| 复制按钮 | 点击 | "复制成功" toast 1.5s | 文案切换，无位移 |

## 可访问性清单
- [x] 键盘导航：输入框→按钮→售后入口 Tab 顺序合理
- [x] 焦点态：可见 focus ring（青绿描边）
- [x] 表单 label：CodeInput 关联 `<label for>`（UX-002）
- [x] 对比度：正文 #F4F4FB / 卡片 #1A1B2E ≈ 13:1；muted 文本 ≥ 4.5:1（UX-002）
- [x] reduced-motion：`prefers-reduced-motion` 媒体查询回退
- [x] 响应式：390 与 1440 无横向滚动/遮挡/截断（UX-001）
