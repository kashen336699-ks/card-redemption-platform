---
id: SPEC-PRODUCT
version: 1.0
status: draft
owner: product
updated_at: 2026-06-19
source_ids: [SRC-001]
---

# 产品需求规格（product.md）— 卡密兑换平台

## 目标
让闲鱼数字商品买家**无需注册**，粘贴卡密即可安全、即时、确定地领取对应商品；以一次性兑换、库存绑定、结果可追溯、异常可售后为核心。解决人工发货成本高、敏感信息聊天窗外泄、卡密状态不统一、失败原因不透明四大问题。

## 范围 / 非目标
- **范围（MVP）**：兑换首页、卡密校验、商品交付、结果状态展示、审计日志、管理后台最低能力（商品/卡密/库存/兑换记录）、售后查询。
- **非目标**：闲鱼下单/支付/退款/订单同步；用户账号/会员/跨设备历史；营销/优惠券/分销/积分；自动判断闲鱼退款状态（退款后禁用由运营或后续接口完成）；自动发卡（V1.1+）。

## 用户与场景
| 角色 | 目标 | 关键场景 |
|---|---|---|
| 购买用户 | 快速、明确、安全领取已购商品 | 输入卡密、查看结果、复制/打开商品 |
| 运营管理员 | 批量建卡绑商品、掌握兑换情况 | 商品配置、卡密导入、状态查询、禁用 |
| 售后人员 | 定位失败原因、补发或解锁 | 按卡密末四位/订单号/兑换编号查询、查日志、人工处理 |
| 系统服务 | 原子化校验、占用库存、写记录与交付 | 校验、幂等、风控、审计 |

## 功能需求（每条唯一 ID + MUST/SHOULD/MAY）

### 前台兑换（FR-0xx）
| ID | 描述 | 强度 | 验收要点 | source |
|---|---|---|---|---|
| FR-001 | 卡密输入框支持输入与粘贴 | MUST | 自动去首尾空格；忽略分隔符与大小写 | SRC-001 §6.1 FE-01 |
| FR-002 | 提交前前端基础校验 | MUST | 空值、长度、非法字符即时提示 | SRC-001 §6.1 FE-02 |
| FR-003 | 兑换按钮状态机 | MUST | 默认/悬停/加载/禁用明确；加载时不可重复提交 | SRC-001 §6.1 FE-03 |
| FR-004 | 提交后端兑换并返回结果 | MUST | 一次提交内有效卡密兑换成功，返回正确商品，状态变 REDEEMED | SRC-001 §12 |
| FR-005 | 成功结果页展示 | MUST | 成功图标、商品名、有效期/规格、兑换编号 | SRC-001 §6.2 |
| FR-006 | 按 delivery_type 渲染交付内容 | MUST | 文本/激活码/链接/下载/操作指引差异化结构 | SRC-001 §6.2、§8 |
| FR-007 | 交付内容一键复制 | MUST | 复制按钮可用；高价值商品 SHOULD 点击后显示 | SRC-001 §6.2 |
| FR-008 | 失败页稳定错误文案与下一步 | MUST | 7 类错误码各有用户文案与可执行动作，不暴露内部规则 | SRC-001 §6.3 |
| FR-009 | 失败页始终提供售后入口 | MUST | 任何失败态都有可执行售后方式 | SRC-001 §6.1 FE-05 |
| FR-010 | 处理中态轮询查询结果 | SHOULD | GET /redemptions/{id} 返回 status + result/error | SRC-001 §8 |

### 兑换校验与状态机（FR-1xx）
| ID | 描述 | 强度 | 验收要点 | source |
|---|---|---|---|---|
| FR-101 | 卡密存在性校验 | MUST | 不存在返回 INVALID_CODE | SRC-001 §6.3 |
| FR-102 | 卡密状态机 6 态 | MUST | AVAILABLE/PROCESSING/REDEEMED/EXPIRED/DISABLED/NO_STOCK 语义与展示符合 §5 表 | SRC-001 §5 |
| FR-103 | 有效期校验 | MUST | 超期返回 EXPIRED_CODE | SRC-001 §6.3 |
| FR-104 | 商品绑定校验 | MUST | 每张卡密仅绑定一个 SKU；交付绑定商品正确率 ≥99.9% | SRC-001 §5.1、§1.3 |
| FR-105 | 可交付库存校验 | MUST | 无库存返回 NO_STOCK | SRC-001 §6.3 |
| FR-106 | 事务内锁定卡密+库存并生成兑换记录 | MUST | 状态条件更新 AVAILABLE→REDEEMED；库存扣减与记录创建同事务，任一失败整体回滚 | SRC-001 §4.1、§4.2 |
| FR-107 | 兑换成功后重复查询只返回已兑换提示 | MUST | 不再次创建交付 | SRC-001 §4.2 |

### 管理后台与售后（FR-2xx）
| ID | 描述 | 强度 | 验收要点 | source |
|---|---|---|---|---|
| FR-201 | 商品管理 | MUST | 创建商品、配置交付类型/说明/上下架 | SRC-001 §7.2 |
| FR-202 | 卡密批量生成/导入 | MUST | 绑定商品、有效期、批次、闲鱼订单号 | SRC-001 §7.2 |
| FR-203 | 卡密状态/兑换记录查询 | MUST | 查状态、兑换时间、兑换编号、失败日志 | SRC-001 §7.2 |
| FR-204 | 禁用未兑换卡密 | MUST | 可禁用 AVAILABLE 卡密 | SRC-001 §7.2 |
| FR-205 | 库存内容导入与计数 | MUST | 可用/锁定/已交付/异常数量可见 | SRC-001 §7.2 |
| FR-206 | 人工重置/补发 | SHOULD | 二次确认 + 记录操作者/原因/旧兑换记录 | SRC-001 §5.1、§7.2 |
| FR-207 | 售后脱敏查询接口 | MUST | POST /support/lookup 返回脱敏卡密状态与日志摘要；支持末四位/订单号/兑换编号定位 | SRC-001 §8、§12 |

### 审计与幂等（FR-3xx）
| ID | 描述 | 强度 | 验收要点 | source |
|---|---|---|---|---|
| FR-301 | 全链路审计日志 | MUST | 记录请求、状态变化、IP、设备摘要、结果、耗时；不含完整卡密/交付明文 | SRC-001 §3.1、§12 |
| FR-302 | request_id 幂等 | MUST | 重复 request_id 返回同一处理结果 | SRC-001 §4.2 |
| FR-303 | 埋点事件 | SHOULD | page_view/code_submit/redeem_result/delivery_copy/support_click | SRC-001 §11 |

## 非功能需求
| ID | 类别 | 指标/约束 | 强度 |
|---|---|---|---|
| NFR-001 | 性能 | 兑换接口 P95 ≤ 2s | MUST |
| NFR-002 | 性能 | 首屏在常见 4G 下 ≤ 2.5s | SHOULD |
| NFR-003 | 可用性 | 月可用性 ≥ 99.9%；系统异常不得错误消耗卡密 | MUST |
| NFR-004 | 兼容性 | Chrome/Edge/Safari 最近两大版本；主流安卓/iOS 浏览器 | MUST |
| NFR-005 | 可观测性 | 监控成功率、错误码分布、接口耗时、库存量、暴力尝试、异常并发 | SHOULD |
| NFR-006 | 可维护性 | 商品与交付类型配置化；错误码稳定；日志按兑换编号检索 | MUST |
| UX-001 | 响应式 | 390px 移动端与 1440px 桌面端无横向滚动、无遮挡、无截断 | MUST |
| UX-002 | 无障碍 | 输入框有 label；键盘可操作；关键文本对比度 ≥ 4.5:1 | MUST |
| UX-003 | 视觉系统 | 深色科技感：紫色主品牌色、青绿安全状态色、Noto Sans SC、圆角卡片、明确状态反馈 | SHOULD |

## 安全需求（SEC-xxx）
| ID | 描述 | 强度 |
|---|---|---|
| SEC-001 | 卡密不存明文；HMAC-SHA256 索引查询，必要时另存加密密文 | MUST |
| SEC-002 | 同一卡密并发最多成功一次（事务/行锁/原子条件更新为最终保障，前端防重不可替代后端幂等） | MUST |
| SEC-003 | 全站 HTTPS + HSTS；禁止经 URL Query 传卡密 | MUST |
| SEC-004 | 错误信息不暴露卡密是否"接近正确"，不返回内部库存 ID/卡密明文/DB 错误/风控阈值 | MUST |
| SEC-005 | 暴力枚举防护：IP+设备指纹+网段限速、连续失败递增等待、异常时验证码（TOO_MANY_ATTEMPTS） | MUST |
| SEC-006 | 交付内容字段级加密；密钥与数据库分离 | MUST |
| SEC-007 | 日志只记卡密末四位或不可逆摘要，禁记交付明文；IP 哈希或截断存储 | MUST |
| SEC-008 | XSS/CSRF 防护：CSP、输出编码、输入白名单、SameSite Cookie、CSRF 策略 | MUST |
| SEC-009 | 管理后台 RBAC、关键操作二次确认与审计可追责 | MUST |
| SEC-010 | 交付链接 SHOULD 使用短时签名 URL，避免永久公开地址 | SHOULD |
| SEC-011 | 备份加密并定期演练恢复 | SHOULD |

## 业务规则与术语
- **术语**：卡密(card key/code)、SKU、批次(CardBatch)、库存项(InventoryItem)、兑换记录(Redemption)、兑换编号(redemption_id)、交付类型(delivery_type)。
- **卡密格式**：建议 16–24 位随机字符，4 位分组展示；存储不依赖分隔符；可排除易混字符 O/0、I/1；至少 80 bit 随机熵。
- **状态机**：AVAILABLE→(PROCESSING)→REDEEMED 为主路径；EXPIRED/DISABLED/NO_STOCK 为终止/拒绝态。已兑换默认不可重置，售后重置须记录操作者/原因/旧记录。
- **数据对象**：Product / CardBatch / CardKey / InventoryItem / Redemption / AuditLog（字段见 PRD §7.1）。
- **错误码**：INVALID_CODE / ALREADY_REDEEMED / EXPIRED_CODE / DISABLED_CODE / NO_STOCK / TOO_MANY_ATTEMPTS / SYSTEM_ERROR。

## 建议 feature 边界（供 /wz:plan 参考，非最终切分）
1. `1.redeem-frontend` — 兑换首页/成功/失败前台（FR-001~009, UX-*）
2. `2.redeem-api` — 兑换校验、状态机、事务幂等、轮询（FR-004,101~107, FR-302, SEC-002）
3. `3.data-security` — 卡密 HMAC/加密、库存字段级加密、密钥分离（SEC-001,006,007）
4. `4.audit-observability` — 审计日志、埋点、监控（FR-301,303, NFR-005）
5. `5.admin-support` — 管理后台 + 售后查询（FR-201~207, SEC-009）
6. `6.security-hardening` — 限流/防枚举/HTTPS/CSP/CSRF（SEC-003,004,005,008）

## 假设与待确认问题
- `ASSUMPTION`: 无版本控制（用户跳过 git，G0 记录）。
- `ASSUMPTION`: 卡密本身即兑换凭证（PRD 关键假设）；高价值商品二次校验留待 V1.1。
- `ASSUMPTION`: 部署目标为 AWS（Lambda + CDK），与工作流技术栈规则一致。

**人工已裁决（2026-06-19，原 BLOCKER → DECISION）：**
- `DECISION-1`（存储）：**DynamoDB**。幂等用 `ConditionExpression`（AVAILABLE→REDEEMED 条件更新），卡密+库存+兑换记录原子性用 `TransactWriteItems`；不引入关系库。满足 SEC-002/FR-106/FR-302。
- `DECISION-2`（隐私）：审计日志与兑换记录保留 **90 天**，超期自动清理/匿名化（DynamoDB TTL）。埋点与清理策略以此为准。
- `DECISION-3`（权限）：MVP **单管理员 + 简单口令/基本认证**，不做多角色 RBAC；SEC-009 在 MVP 降级为"单管理员 + 关键操作二次确认 + 审计"，完整 RBAC 留待后续。
- `DECISION-4`（安全/密钥）：**AWS KMS + Secrets Manager**。KMS 管字段级加解密，Secrets Manager 存 HMAC 密钥，密钥与 DynamoDB 分离。满足 SEC-001/006。
- `DECISION-5`（发布范围）：**MVP-1 = 前台三页 + 兑换校验 API**；卡密/商品先用脚本导入。管理后台（5.admin-support）下沉 MVP-2。

> 影响：feature 优先级调整为 1.redeem-frontend、2.redeem-api、3.data-security、6.security-hardening、4.audit-observability 先行；5.admin-support 进 MVP-2。架构与 OpenAPI 契约在 /wz:design 按以上决策冻结。

## 变更记录
| 版本 | 日期 | 变更 |
|---|---|---|
| 1.0 | 2026-06-19 | 由 PRD V1.0 生成首版需求规格 |
