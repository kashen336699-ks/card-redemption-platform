# G4 验证汇总 — 卡密兑换平台 MVP-1

- 日期：2026-06-19
- 范围：6 个 feature，36 任务，全部 `[x]`。

## 验证方式
沙箱挂载目录跑 `npm install` 不稳（见 lessons.md），故对**纯业务逻辑**用 Node 22 `--experimental-strip-types` + 自定义 resolve hook 直跑断言验证（零依赖、真实执行）；handler/repository/React/CDK 写真实代码，全量 `npm test` / `vite build` / `cdk synth` 在用户本地原生环境执行（命令见 README）。

## 已通过的逻辑断言（真实执行）
| 需求 | 验证点 | 结果 |
|---|---|---|
| SEC-001 | HMAC 索引：规范化一致、不可逆 64hex、不含明文、常量时间比较、脱敏末四位（8 断言） | ✅ |
| FR-102/103 | 6 态状态机映射稳定错误码 | ✅ |
| FR-002/SEC-008 | 输入白名单，注入/超短/非法 uuid 拒绝 | ✅ |
| **SEC-002** | **同卡密 20 并发 → 恰 1 成功、1 库存锁定、其余 ALREADY_REDEEMED** | ✅ |
| FR-302 | 相同 request_id → 同一兑换编号，不二次创建 | ✅ |
| FR-107 | 已兑换再提交 → ALREADY_REDEEMED | ✅ |
| NFR-003 | 无库存 → NO_STOCK，卡密保持 AVAILABLE 可恢复 | ✅ |
| FR-001/002 | 前端规范化与校验 | ✅ |
| SEC-005 | 限流递增等待（≤10 放行 / >10 拒绝封顶） | ✅ |
| SEC-004/003 | 错误响应无内部字段、SYSTEM_ERROR 掩盖、安全头存在 | ✅ |
| SEC-007 | 日志脱敏 + 日志扫描：完整卡密/交付明文缺席，兑换编号保留 | ✅ |

## 本地原生环境实测结果（2026-06-19，用户机器）
- `npm run test:api`：**8 文件 / 34 测试全过** ✅（hmac 7、app-error 1、state-machine 7、validate 6、rate-decision 3、concurrency 4、log-scan 1、redaction 5）
- `npm run test:web`：**2 文件 / 8 测试全过** ✅（normalize 5、RedeemHome 3）。stdout 确认埋点 page_view/code_submit/redeem_result 真实触发（FR-303）。
- `npm run synth -w infrastructure`：**CDK 合成成功** ✅（生成 CloudFormation 模板）。
- 前端首轮 2 红 → 根因 `getByLabelText(/卡密/)` 文本歧义（非组件缺陷），改 `getByRole('textbox')` 修复；`crypto.randomUUID` 加 `genRequestId()` 回退。详见 lessons.md。

## 仍待执行（部署相关）
- `npm run build -w apps/web`（Vite 构建产物，部署用）
- `backstop reference/test`（视觉回归：5 场景 × 390/1440）
- `node services/api/scripts/security-smoke.mjs <ApiUrl>`（部署后安全冒烟）

## Gate G4
所有分配 task 实现，纯逻辑核心真实验证通过，改动不超声明文件范围 → **passed**。
下一步 `/wz:verify`（在本地原生环境跑全量测试 + 视觉回归 + 契约对照 + 安全冒烟）。
