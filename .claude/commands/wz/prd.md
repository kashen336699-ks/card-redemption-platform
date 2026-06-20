---
description: 解析多模态需求，生成 product.md / acceptance.md 与待确认问题；支持 --change 变更模式（产物 G1）
argument-hint: "[输入文件或目录...] [--strict] | --change <N>.<feature> <变更描述>"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(cat:*)
---

# /wz:prd — 多模态需求规格

第 1 阶段。把模糊、多模态输入转化为可验证的结构化需求。**不自行决定关键商业规则。**

## 输入标准化（先做 input manifest）
为每个输入生成 source_id、类型、路径、摘要、可信度，写 `.wz/memory/source-map.json`。

| 输入类型 | 解析动作 | 标准化输出 |
|---|---|---|
| PRD/Markdown/Word | 提取章节、约束、术语、验收项 | requirements.json |
| 图片/设计稿 | OCR、布局分区、颜色与组件识别 | design-observations.md + assets manifest |
| Excel/CSV | 识别字段、状态、规则、映射 | data-dictionary.md + sample-data |
| 语音/视频 | 转写、说话人分离、关键帧时间戳 | transcript.md + decisions.md |
| 现有代码仓库 | 框架、依赖、目录、测试、部署 | repo-profile.json + constraints.md |

## 步骤
1. 抽取事实、假设、约束、术语、业务规则、未决问题 —— 不直接进入编码。
2. 冲突内容生成 conflict list，由产品负责人选权威来源（Inverter 模式：反向提问补齐未知）。
3. 每条需求分配唯一 ID（FR-/NFR-/UX-/SEC-），并在后续所有文档引用以实现可追溯。
4. 用 `.wz/templates/product.md` 与 `acceptance.md` 生成正式规格。

## "完善需求"的定义（重要）
不是 AI 自动补齐所有空白，而是输出**合理假设、风险与待确认问题**；
凡涉及存储、权限、计费、隐私、发布范围的关键决策必须 `BLOCKER` 标记交人工确认。

---

## 模式判断
`$ARGUMENTS` 以 `--change` 开头 → **变更模式**；否则 → **新建模式**（上文流程）。
> feature 切分与 PLAN.md 索引在 `/wz:plan` 完成（本工作流将切分作为计划阶段一等步骤）；prd 阶段只做需求与验收，并标出建议的 feature 边界供 plan 参考。

## 变更模式（--change）
当输入 `/wz:prd --change {N}.{feature} 变更内容` 时执行。

1. **定位入口 feature**：先读 `docs/specs/PLAN.md` 了解全局划分与依赖；在 `docs/specs/features/` 找 `{N}.*` 目录，找不到则报错。
2. **评估影响范围（可跨 feature）**：读入口 feature 的 design.md/tasks.md 与全局 product/acceptance，判断变更是否横跨多个 feature；依 PLAN.md 依赖列出**全部受影响 feature**，逐个执行。
   ```text
   🔎 变更影响范围：入口 2.user-auth-login
     连带影响：3.user-auth-register（共用 session，依赖 2.T-004）
   ```
3. **更新 product.md / acceptance.md（全局）**：在「变更记录 / 需求版本」表追加新版本行；功能需求标注 `[v2 新增]`/`[v2 修改]`/`~~删除~~ [v2 删除]`。
4. **更新受影响 feature 的 tasks.md**：追加任务版本；已完成 `[x]` 不动；受影响未完成 task 标 `[CHANGED]` 并更新描述；作废标 `[DROPPED]`；新增标 `[NEW]`。跨 feature 引用加 `{序号}.` 前缀。
5. **更新 PLAN.md**：若依赖/新增 feature/作废 feature 变化，同步依赖列、状态、执行顺序。
6. **输出变更摘要**：新增/修改/删除的需求与任务数、未受影响的已完成任务数，并提示「审查后运行 `/wz:ai`（会跳过已完成任务）」。

## 输出与 Gate
- 产物：`docs/specs/product.md`、`docs/specs/acceptance.md`、待确认问题清单；变更模式下额外更新 feature tasks.md 与 PLAN.md。
- `G1`：所有 MUST 需求有 ID + 可执行验收条件，且无未裁决的关键 BLOCKER。
下一步：`/wz:design`（新建）或 `/wz:ai`（变更，跳过已完成 task）。
