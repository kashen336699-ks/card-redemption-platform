# Handoff — 会话交接

## 已完成
- /wz:init → **G0 passed**：补齐 docs/specs|contracts|decisions|evidence 与 tests 目录，写 repo-profile.json、init-report.md。用户选择跳过 git（ASSUMPTION: 无版本控制）。
- /wz:prd → **G1 passed**：生成 product.md（FR/NFR/UX/SEC 全量编 ID）、acceptance.md（验收矩阵对照 PRD §12）、source-map.json。5 个 BLOCKER 已人工裁决并回填，记录 ADR-0001。

## 关键决策（ADR-0001）
- D1 DynamoDB；D2 保留 90 天 TTL；D3 单管理员口令；D4 KMS + Secrets Manager；D5 MVP-1 仅前台+兑换API。
- feature 优先级：1.redeem-frontend → 2.redeem-api → 3.data-security → 6.security-hardening → 4.audit-observability（MVP-1）；5.admin-support 进 MVP-2。

## 验证结果
- 文档级自检：所有 MUST 需求均有 ID 与可执行验收条件；PRD §12 八条验收已逐条映射到需求 ID。

## G2 已完成（/wz:design → passed）
- 设计源：无外部稿 → design-prototype 生成 HTML+CSS 原型（tokens.css + 兑换首页/成功/失败三页，响应式 390/1440，覆盖 default/loading/disabled/error）。
- design.md：页面×断点×状态矩阵覆盖 UX-001/002/003。
- architecture.md：DynamoDB 单表 + TransactWriteItems 幂等（SEC-002/FR-106）、KMS+Secrets Manager、S3+CloudFront、API GW+Lambda 分层、90天 TTL。MVP-1 不引入 SQS/SF。
- openapi.yaml：3 接口 + 7 错误码，FROZEN（ADR-0002），openapi-spec-validator VALID。

## G3 已完成（/wz:plan → passed）
- PLAN.md：MVP-1 六 feature + MVP-2 一 feature。执行序：0.scaffold → 3.data-security → 2.redeem-api →（1.redeem-frontend 与 2 契约冻结后并行，用 Mock）→ 6.security-hardening → 4.audit-observability。5.admin-support 推迟 MVP-2。
- 6 份 tasks.md，共 36 任务，任务数 5/5/8/8/5/5（均≤8），每任务含需求ID/文件范围/验证命令/估时（15/30min），依赖图均 DAG 无环。

## G4 已完成（/wz:ai → passed）
- 6 feature / 36 task 全部实现并标 [x]。monorepo：packages/contracts、services/api、apps/web、infrastructure。
- 后端：handlers(redeem/get/support)+domain(状态机/幂等/校验)+repository(DynamoDB TransactWriteItems)+crypto(HMAC/KMS/Secret)+middleware(限流)+audit+logger。
- 前端：React+Tailwind 还原三页+api client/mock+埋点+组件测试+backstop。
- IaC：CDK 单 stack（DynamoDB 单表+GSI1+TTL、KMS、Secrets、3 Lambda、HTTP API、S3+CloudFront+安全头、CW Dashboard/Alarm）。
- 验证：纯逻辑核心 Node 直跑断言全过——SEC-002 并发只成功一次、FR-302/107 幂等、NFR-003 回滚、状态机、限流、SEC-004 不泄露、SEC-007 脱敏。证据 docs/evidence/G4-verification-summary.md。
- git 已 init（main）；提交与全量 npm test/vite build/cdk synth/backstop/安全冒烟在用户本地原生终端跑（README.md）。

## 下一步
- **/wz:verify**（G5）：本地原生环境全量 vitest + 视觉回归(逐断点) + 接口对照冻结契约 + 安全冒烟；不过回 /wz:ai 修。
