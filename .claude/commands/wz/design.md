---
description: 生成 UI 设计、架构、API 契约与 AWS 方案；无外部设计稿时自动生成 HTML+CSS 设计稿（产物 G2）
argument-hint: "[--scope <module>] [设计稿链接] [--no-prototype]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Skill
---

# /wz:design — 架构与设计

第 2 阶段。产出可实现的设计与**冻结 API 契约**。不跳过 ADR 决策。

## 步骤
1. **UI 设计规格**：用 `.wz/templates/design.md` 建立 **页面 × 断点 × 状态矩阵** 与 design tokens（映射 Tailwind theme）。
2. **设计源（二选一，决定能否像素级还原）**：
   - **有外部设计稿**（Figma 链接 / 截图 / HTML+CSS）→ 直接作为还原源；装了 Figma MCP 则自动拉取。在 design.md「设计源」登记来源。
   - **无外部设计稿** → 调用 `design-prototype` skill，从 PRD + design.md **生成 HTML+CSS 设计稿原型**（含 `tokens.css`），写到 `docs/specs/features/{N}.{name}/design/`，作为还原源与视觉回归基线。
     > 传 `--no-prototype` 可跳过生成（则前端走"AI 自行设计"，无像素级真值对照）。
3. **架构**：用 `architecture.md` 记录已选方案/备选/理由/成本/风险；部署边界按 L1 lambda 规则。
4. **API 契约**：在 `docs/contracts/openapi.yaml` 定义接口、错误码、Schema，并**冻结**（contract freeze）。
5. **关键决策**写 `docs/decisions/ADR-xxx.md`。

## 输出与 Gate
- 产物：design.md、设计源（外部设计稿登记 或 `design/` 下 HTML+CSS 原型）、architecture.md、docs/contracts/*、ADR。
- `G2`：设计矩阵覆盖全部 UX 需求；存在可还原的设计源（外部或生成原型，除非显式 `--no-prototype`）；OpenAPI 通过 lint 并标记 frozen；关键架构有 ADR。
下一步：`/wz:plan`。
