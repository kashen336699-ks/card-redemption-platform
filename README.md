# 卡密兑换平台（card-redemption-platform）

闲鱼数字商品订单的安全兑换与即时交付系统（MVP）。React + Tailwind 前端、AWS Lambda（Node 22）后端、DynamoDB、AWS CDK。

> 本仓库由 WZ AI 全栈工作流（`/wz:*`）推进：G0 init → G1 prd → G2 design → G3 plan → **G4 ai（已完成）** → G5 verify → G6 review → G7 deploy。规格见 `docs/specs/`，证据见 `docs/evidence/`。

## 目录结构
```
packages/contracts   # OpenAPI 派生的共享 TS 类型 + ERROR_CATALOG
services/api         # Lambda 后端：handlers / domain / repository / crypto / audit / middleware
apps/web             # React + Vite + Tailwind 前台（兑换首页 / 成功 / 失败）
infrastructure       # AWS CDK：DynamoDB / KMS / Secrets / Lambda / API GW / S3+CloudFront / CloudWatch
docs/                # specs(产物) / contracts(冻结 OpenAPI) / decisions(ADR) / evidence(变更与验证)
```

## 本地环境要求
- Node.js ≥ 20（建议 22）、npm ≥ 10
- 部署阶段另需：AWS CLI 凭证、AWS CDK

## 安装与验证（在你的原生终端执行）
```bash
# 1) 安装依赖（monorepo workspaces）
npm install

# 2) 后端单测（vitest：hmac / 状态机 / 校验 / 并发 / 安全脱敏）
npm run test:api

# 3) 前端组件测试 + 构建
npm run test:web
npm run build -w apps/web

# 4) 基础设施合成（生成 CloudFormation 模板）
npm run synth -w infrastructure

# 5) 视觉回归基线 + 比对（以 design-prototype 原型为基线）
npm run test:visual:ref -w apps/web
npm run test:visual -w apps/web
```

> 说明：本项目在 AI 工作流的沙箱中开发，沙箱挂载盘跑 `npm install` 不稳，故纯业务逻辑已用 Node 直跑断言验证（见 `docs/evidence/G4-verification-summary.md`），其余全量测试/构建/synth 请在本机执行。

## 部署（preview/staging/prod）
```bash
cd infrastructure
npm install && npx cdk bootstrap          # 首次
npx cdk diff Wz-preview -c env=preview     # 看变更（高亮删除/权限扩大）
npm run deploy:preview                      # 部署 preview

# 部署后：前端同步到站点桶 + 安全冒烟（用 cdk 输出的 WebBucketName / ApiUrl）
npm run build -w apps/web && aws s3 sync apps/web/dist s3://<WebBucketName>/
node services/api/scripts/security-smoke.mjs <ApiUrl>
```

## 关键设计决策（ADR）
- `docs/decisions/0001-mvp-architecture-decisions.md`：DynamoDB / KMS+Secrets Manager / 单管理员 / 90 天 TTL / MVP-1 仅前台+兑换 API。
- `docs/decisions/0002-openapi-contract-freeze.md`：OpenAPI 契约冻结（前后端按此并行）。

## 安全要点
卡密不存明文（HMAC 索引）、交付内容 KMS 字段级加密、并发只成功一次（DynamoDB TransactWriteItems 条件更新）、限流递增等待、错误响应不泄露内部细节、日志脱敏、全站 HTTPS+HSTS+CSP。
