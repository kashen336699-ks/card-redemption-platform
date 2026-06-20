# Verify Report — G5 独立验证

- 日期：2026-06-19
- 范围：MVP-1 全量（6 feature / 36 task）
- QA 触发：必触发（feature 全完成 + API 变更 + 认证/数据相关）→ 全量 QA。

## 1. 功能验证（按 acceptance.md 需求 ID）
后端 `npm run test:api`：**8 文件 / 34 测试全过**（本地原生环境）。
| 需求 ID | 测试 | 结果 |
|---|---|---|
| SEC-001 | crypto/hmac（索引/规范化/脱敏/常量时间） | ✅ 7 |
| FR-102/103/104/105 | domain/state-machine（6 态→错误码） | ✅ 7 |
| FR-002/SEC-008 | domain/validate（白名单/注入拒绝） | ✅ 6 |
| **SEC-002/FR-302/FR-107/NFR-003** | test/concurrency（20 并发只成功一次/幂等/回滚） | ✅ 4 |
| SEC-005 | middleware/rate-decision（递增等待） | ✅ 3 |
| SEC-004/003 | test/security/redaction（不泄露/安全头） | ✅ 5 |
| SEC-007 | test/security/log-scan（无明文） | ✅ 1 |
| NFR-006 | lib/app-error | ✅ 1 |

前端 `npm run test:web`：**2 文件 / 8 测试全过**（normalize 5、RedeemHome 3）。stdout 确认埋点 page_view/code_submit/redeem_result 触发（FR-303）。

## 2. 视觉回归（BackstopJS 6.3.25）
`backstop reference` 建基线 → `backstop test`：**10 Passed / 0 Failed**（5 场景 × 390/1440 两断点，UX-001）。
- 场景：redeem-home default/loading/error、redeem-success、redeem-error(ALREADY_REDEEMED)。
- 报告：`docs/evidence/visual/report`；基线：`docs/evidence/visual/reference`。
- 说明：当前以 design-prototype 原型为基线参照（无外部设计稿）；React 实现 vs 原型的逐像素对照建议在 `vite preview` 起服务后接入（联调/部署阶段，阈值待调）。

## 3. 接口契约对照（响应实例 vs 冻结 OpenAPI）
用**真实代码产出**的响应实例校验 `docs/contracts/openapi.yaml` 组件 schema：
| 响应类型 | 结果 |
|---|---|
| ErrorResponse（含 7 错误码 + action enum） | ✅ 符合 |
| RedeemSuccess（product/delivery 结构） | ✅ 符合 |
| RedeemProcessing | ✅ 符合 |
| SupportLookupResult（脱敏 + nullable redeemed_at） | ✅ 符合（OpenAPI 3.0 nullable） |

## 4. 安全冒烟
- 离线已验证：错误响应不泄露内部字段（SEC-004）、SYSTEM_ERROR 掩盖、安全头存在（SEC-003）、日志脱敏（SEC-007）、限流递增（SEC-005）、注入字符拒绝（SEC-008）。
- 待部署后执行：`node services/api/scripts/security-smoke.mjs <ApiUrl>`（鉴权/限流 429/重放，对真实端点）。**非 G5 阻塞**，列入 G7 部署后冒烟。

## 5. 可部署性
`npm run synth -w infrastructure`：**CDK 合成成功**，生成 CloudFormation 模板。资源：DynamoDB 单表+GSI1+TTL、KMS、Secrets、3 Lambda、HTTP API、S3+CloudFront+ResponseHeadersPolicy、CW Dashboard/Alarm。最小权限逐函数授予。

## Findings
见 `docs/evidence/findings.json`。
- **F-001 (P3, 信息级)**：用 Draft7 校验器初次校验时 `SupportLookupResult.redeemed_at: null` 报错——实为校验器不识别 OpenAPI 3.0 `nullable: true`；按 OpenAPI 3.0 语义复验通过，**非代码缺陷，无需修改**。
- 无 P0/P1/P2。

## Gate G5
所有 MUST 需求验证通过、视觉差异在阈值内（10/10）、契约一致、可部署性通过 → **passed**。
安全冒烟（对真实端点）列入 G7 部署后执行，不阻塞 G5。
下一步：`/wz:review`（G6 代码审查 + 安全审计）。
