# Changelog — 4.audit-observability（G4）

- 日期：2026-06-19
- 关联需求：FR-301/303、NFR-005/006、SEC-007、D2

## 变更摘要
- `audit/audit.ts`：审计写入 DynamoDB（`RDM#<id>` / `LOG#<ts>`），只记 cardHmac 末四位 + ipHash + action + TTL 90 天（D2/SEC-007）；失败不阻断主流程但记 error。
- `lib/logger.ts`：结构化 JSON 日志 + 脱敏中间件（递归 redact 敏感键 code/delivery/payload…）+ Correlation ID（按兑换编号可检索 NFR-006）。
- `analytics/track.ts`（前端）：5 事件（page_view/code_submit/redeem_result/delivery_copy/support_click），类型约束排除卡密/交付明文（SEC-007）；sendBeacon 轻量上报。页面接入 page_view/code_submit/redeem_result。
- `infrastructure`：CloudWatch Dashboard（调用/错误、P95/P50 延迟）+ Alarm（错误数、P95>2s 对齐 NFR-001）。

## 验证（node --experimental-strip-types）
- NFR-006：`logger.redact` 递归脱敏，兑换编号保留 ✅
- SEC-007：`log-scan` 完整卡密与交付明文均缺席于输出，兑换编号可检索 ✅
- CDK Dashboard/Alarm 经 `cdk synth` 在用户本地原生环境验证。
