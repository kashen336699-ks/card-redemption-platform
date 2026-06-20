# Changelog — 6.security-hardening（G4）

- 日期：2026-06-19
- 关联需求：SEC-003/004/005/008、验收 §12 第8条

## 变更摘要
- `middleware/rate-decision.ts`：纯限流决策（≤10 放行；>10 拒绝并指数退避递增等待，封顶窗口长度）。
- `middleware/rate-limit.ts`：DynamoDB 原子自增计数（窗口 TTL）+ 429 + Retry-After 头（SEC-005），redeem handler 前置接入。
- `lib/http.ts`：统一安全头（HSTS/X-Content-Type-Options/Referrer-Policy/no-store，SEC-003）；错误码→HTTP 映射，绝不透传内部细节（SEC-004）。
- `infrastructure`：S3（私有）+ CloudFront 前端托管，REDIRECT_TO_HTTPS + `ResponseHeadersPolicy`（HSTS 730 天/CSP/frame DENY/referrer no-referrer，SEC-003/008）。
- `scripts/security-smoke.mjs`：部署后冒烟（输入校验 422 / 注入拒绝 / 错误无内部字段 / HSTS 头 / 连发 429）。

## 验证（node --experimental-strip-types）
- SEC-005：`decideRate` ≤10 放行、>10 递增等待且封顶 ✅
- SEC-004：错误响应仅 `{error_code,message,action}`，无 inventory/sku/dynamo/hmac 字段；未知异常 → SYSTEM_ERROR 且不透传 DB 错误 ✅
- SEC-003：响应含 HSTS、X-Content-Type-Options=nosniff ✅
- CDK ResponseHeadersPolicy / 安全冒烟在用户本地原生环境 `cdk synth` / 部署后执行。
