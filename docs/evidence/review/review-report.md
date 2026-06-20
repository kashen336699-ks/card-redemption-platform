# Review Report — G6 代码审查 + 安全审计

- 日期：2026-06-19
- 方式：独立审查视角（基础 / 对抗 / Git-Diff 三视角）+ 安全必检。只读审查 + 定向修复。
- 范围：MVP-1 全量（services/api、apps/web、infrastructure）。

## 安全必检
| 项 | 结果 |
|---|---|
| 硬编码密钥/token | 无 ✅ |
| eval / dangerouslySetInnerHTML / innerHTML | 无 ✅ |
| 前端硬编码 API 地址 | 无（走 VITE_API_BASE_URL）✅ |
| .env 是否 gitignore | 是 ✅ |
| console 散点泄露 | 统一经 lib/logger 脱敏 ✅ |

## Findings（详见 findings.json）
| ID | 级别 | 类别 | 状态 | 摘要 |
|---|---|---|---|---|
| F-101 | P1 | security | **FIXED**（人工裁决：现在修）| 幂等记录持久化交付明文 → 改存 KMS 密文，重放/GET 按需解密 |
| F-102 | P1 | correctness | **FIXED** | 售后凭末四位查询失效（GSI1PK 用 hmac 末四位 vs 查询用卡密末四位）|
| F-103 | P2 | correctness | **FIXED** | 库存查询 Limit:1+Filter 误判 NO_STOCK |

### F-102 修复（已应用 + 复验）
卡密规范化末四位 `lastFour(code)` 经 `RedeemDeps.cardLast4 → CommitInput.cardLast4` 贯通；兑换记录 GSI1PK 与存储字段统一用之；售后查询与 masked_code 用存储的 cardLast4。并发逻辑复验通过（1 成功/1 记录）。

### F-103 修复（已应用）
`getAvailableInventory` 去掉 `Limit:1`，由 FilterExpression 服务端返回可用项取首条，避免漏判。

### F-101（待人工裁决）
幂等记录（IDEMP item）持久化了对外 `response`，其 `delivery` 含**已解密的交付明文**，仅由 DynamoDB 静态加密保护，未做字段级加密 → 弱化 SEC-006（密钥与库分离的字段级加密）。GET /redemptions/{id} 亦依赖该明文返回。
- **建议修复**：幂等记录不存交付明文，改存 inventory 的 KMS 密文（或 inventoryId 指针），在幂等重放/GET 时按 assignedRedemptionId 重新解密。涉及 domain 幂等返回契约 + repo + get-redemption handler。
- 按工作流：安全数据流变更属 SECURITY_HOLD，不自动合并，升级人工裁决。

## 发布建议
`fix-then-ship`：F-102/F-103 已修；**F-101 需人工裁决修复方案后方可过 G6**。
