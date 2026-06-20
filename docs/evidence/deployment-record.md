# 发布记录（deployment-record.md）

| 项 | 值 |
|---|---|
| 环境 | preview |
| 日期 | 2026-06-19 |
| 账户/区域 | 218885889674 / us-east-2 |
| Stack | Wz-preview（arn …:stack/Wz-preview/9a0355c0-…）|
| 部署耗时 | 192.74s |
| 发布方式 | 全量（preview）|
| 批准人 | preview 无需审批（已 y 确认 IAM 变更）|

## 部署输出（CfnOutput）
| Key | Value |
|---|---|
| ApiUrl | https://y5dj5lguu2.execute-api.us-east-2.amazonaws.com |
| WebUrl | https://d2lnhhcasjladg.cloudfront.net |
| WebBucketName | card-preview-web-218885889674 |
| TableName | card-redemption-preview |
| KmsKeyId | 5807d0d8-1c28-4b53-957d-6cc470d1dc2a |
| HmacSecretId | card/preview/hmac-key |

## 部署命令序列（在你本地终端执行）
```bash
cd ~/Desktop/lession/class2/project2

# 0) 验证凭证与区域
aws sts get-caller-identity

# 1) 基础设施依赖 + 首次 bootstrap（每账号/区域一次）
cd infrastructure
npm install
npx cdk bootstrap

# 2) 看部署计划（高亮资源删除/IAM 扩大/数据变化）
npx cdk diff Wz-preview -c env=preview

# 3) 部署（首次会让你确认 IAM 变更，输入 y）
npx cdk deploy Wz-preview -c env=preview
#   记下输出：ApiUrl / WebBucketName / WebUrl

# 4) 构建前端并指向真实 API，同步到站点桶
cd ..
VITE_API_BASE_URL="<ApiUrl>/api/v1" npm run build -w apps/web
aws s3 sync apps/web/dist "s3://<WebBucketName>/"

# 5) 后端冒烟（端点可达 + 负路径 + 安全头）
node services/api/scripts/smoke.mjs "<ApiUrl>"

# 6)（可选）导入一张卡密测成功路径
TABLE_NAME=card-redemption-preview \
KMS_KEY_ID="<cdk 输出/控制台取 keyId>" \
HMAC_SECRET_ID="card/preview/hmac-key" \
node services/api/scripts/seed.mjs "ABCD-EFGH-JKLM-NPQR" "XX会员季卡" "DEMO-激活码-8888"
#   然后打开 WebUrl，用该卡密兑换，应返回成功 + 交付内容
```

## CloudFormation 变更摘要（部署后从 cdk diff/deploy 输出填）
- 新增：DynamoDB 表(+GSI1+TTL+PITR)、KMS Key、Secrets Manager、3×Lambda、HTTP API、S3、CloudFront(+安全头)、CW Dashboard/Alarm。
- IAM：逐函数最小权限（表读写/解密/读密钥），无 `*` 资源。
- 数据/存储：新建空表，无迁移。

## 冒烟结果（实测 SMOKE PASS，7/7）
- POST /redemptions 非法→422 + HSTS 头 + Content-Type JSON：✅
- 不存在卡密→409 稳定错误码 + 响应无内部字段（SEC-004）：✅
- GET /redemptions/{id} 未知→404：✅
- POST /support/lookup 可达→404：✅
- 前端构建：vite 40 modules，built 1.67s；已 sync 到 S3（index.html/css/js）✅
- （可选）seed 后真实兑换成功：待执行

## 部署后修复
- **CORS（前端实测发现）**：前端在 CloudFront 域、API 在 execute-api 域，跨域。HTTP API 未配 CORS → 浏览器 OPTIONS 预检 404 → 兑换请求被拦。修：HttpApi 加 `corsPreflight`（preview 放开来源，prod 应收紧到 CloudFront 域名），redeploy 即生效，前端无需重建。

## 构建修复（部署中发现）
- `tsc -b` 严格类型检查报 6 错：① `import.meta.env` 未声明 → 新增 `apps/web/src/vite-env.d.ts`（vite/client 引用 + VITE_ 变量声明）；② `classify` 三响应类型交叉坍缩为 never → 改为先取 status 再按需断言。vitest 因走 esbuild 未暴露，build 的 tsc 暴露。

## 指标（发布后观察窗）
- 错误率 / P95(≤2s) / 冷启动 / 库存量：见 CloudWatch Dashboard `card-preview`。

## 回滚点
- preview 首发无前版；如需回退：`npx cdk destroy Wz-preview` 或重部署上一 commit。
- prod 才启用 CodeDeploy Canary + 错误率告警自动回滚。

## 结论
- G7：**passed** — Wz-preview 部署成功，前端已上 S3+CloudFront，冒烟 7/7 通过。
- 访问地址：前端 https://d2lnhhcasjladg.cloudfront.net · API https://y5dj5lguu2.execute-api.us-east-2.amazonaws.com
- 清理：不用时 `cd infrastructure && npx cdk destroy Wz-preview -c env=preview`（桶会自动清空）。
