---
id: SPEC-DESIGN
version: 1.0
status: draft
owner: design
updated_at: 2026-01-01
source_ids: []
---

# 设计规格（design.md）

## 页面 × 断点 × 状态矩阵（强制）
| 页面 | UX-ID | 桌面 | 平板 | 移动 | loading | empty | error | disabled |
|---|---|---|---|---|---|---|---|---|
| 登录 | UX-001 | ✓ | ✓ | ✓ | ✓ | n/a | ✓ | ✓ |

## Design Tokens
| token | 值 | Tailwind 映射 |
|---|---|---|
| color.primary | #2563EB | `primary` |
| radius.card | 12px | `rounded-xl` |

## 组件树
<!-- 语义化组件层次，先结构后样式 -->

## 交互与动画
| 元素 | 触发 | 状态变化 | reduced-motion 回退 |
|---|---|---|---|

## 可访问性清单
- [ ] 键盘导航  - [ ] 焦点态  - [ ] 表单 label  - [ ] 对比度  - [ ] reduced-motion
