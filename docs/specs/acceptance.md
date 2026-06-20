---
id: SPEC-ACCEPT
version: 1.0
status: draft
owner: tech-lead
updated_at: 2026-06-19
source_ids: [SRC-001]
---

# 验收标准（acceptance.md）— 卡密兑换平台

## 验收矩阵（每条对应需求 ID + 可执行测试）
| 需求 ID | 验收条件（可执行） | 测试类型 | 测试位置 | 证据路径 |
|---|---|---|---|---|
| FR-001 | 给定含空格/分隔符/混合大小写的卡密，当提交时，则规范化为统一形式并被正确识别 | unit+e2e | tests/unit/normalize, tests/e2e/redeem | docs/evidence/ |
| FR-002 | 给定空值/超长/非法字符，当失焦或提交时，则前端即时提示且不发请求 | component | tests/component | docs/evidence/ |
| FR-003 | 给定加载中状态，当再次点击按钮时，则不触发第二次提交 | component | tests/component | docs/evidence/ |
| FR-004 | 给定有效 AVAILABLE 卡密，当一次提交时，则返回正确商品且状态变 REDEEMED | e2e | tests/e2e/redeem | docs/evidence/ |
| FR-006 | 给定 delivery_type∈{text,code,link,file,guide}，当兑换成功时，则按对应结构渲染 | component | tests/component | docs/evidence/ |
| FR-008 | 给定 7 类错误码，当后端返回时，则展示对应稳定文案与可执行动作，不暴露内部规则 | e2e | tests/e2e/errors | docs/evidence/ |
| FR-106 | 给定事务中库存扣减失败，当兑换时，则整体回滚，卡密保持 AVAILABLE、库存可恢复 | integration | services/api/test | docs/evidence/ |
| FR-107 | 给定已 REDEEMED 卡密，当重复查询时，则只返回已兑换提示，不新建交付 | integration | services/api/test | docs/evidence/ |
| FR-302 | 给定相同 request_id 重放，当并发提交时，则返回同一处理结果 | integration | services/api/test | docs/evidence/ |
| UX-001 | 390px 与 1440px 三状态（首页/成功/失败）像素差 < 阈值，无横向滚动/遮挡/截断 | visual | tests/visual | docs/evidence/visual/ |
| UX-002 | 输入框有 label；Tab 可达全部交互；关键文本对比度 ≥ 4.5:1 | a11y | tests/a11y | docs/evidence/ |
| NFR-001 | 兑换接口 P95 ≤ 2s（负载脚本统计） | perf | tests/perf | docs/evidence/perf/ |
| NFR-003 | 注入系统异常/事务回滚，卡密与库存均保持可恢复状态 | integration | services/api/test | docs/evidence/ |
| SEC-001 | DB 中无明文卡密；以 HMAC 索引查询命中 | integration+审计 | services/api/test | docs/evidence/security/ |
| SEC-002 | 同一卡密并发提交 20 次 → 最多 1 条成功兑换、最多 1 份库存被占用 | concurrency | tests/concurrency | docs/evidence/security/ |
| SEC-004 | 各错误响应不含内部库存 ID/卡密明文/DB 错误/风控阈值 | integration | services/api/test | docs/evidence/security/ |
| SEC-005 | 超频提交触发 TOO_MANY_ATTEMPTS 并递增等待 | integration | services/api/test | docs/evidence/security/ |
| SEC-007 | 日志/埋点中不出现完整卡密与交付明文（仅末四位/摘要） | log-scan | tests/security | docs/evidence/security/ |
| FR-207 | 凭末四位/订单号/兑换编号可定位记录，返回脱敏状态与日志摘要 | integration | services/api/test | docs/evidence/ |

## 每功能最低状态覆盖
正常路径 / 空状态 / 加载 / 失败 / 权限 / 响应式 —— 缺一不可通过 G5。

对照 PRD §12 的 8 条验收，已映射至：FR-004(1)、SEC-002(2)、FR-008(3)、NFR-003(4)、UX-001(5)、SEC-007(6)、FR-207(7)、SEC-002/004/005/008 安全测试(8)。

## 待人工裁决（阻塞 G1→G2）
G1 Gate 要求所有 MUST 需求有 ID + 可执行验收条件（已满足）**且无未裁决关键 BLOCKER**。当前 5 个 BLOCKER（见 product.md「待人工确认」）需用户先确认，否则 G2/design 的架构与 OpenAPI 契约无法准确冻结。
