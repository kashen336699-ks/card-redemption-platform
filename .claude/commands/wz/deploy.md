---
description: 部署到 AWS：CDK diff→人工批准→冒烟→Lambda 别名 Canary 发布→指标校验→自动回滚→发布记录（产物 G7）
argument-hint: "--env preview|staging|prod [--dry-run] [--from <commit>]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task
---

# /wz:deploy — 部署、回滚与运行

第 7 阶段。**无 G6 通过 / 无人工批准不得生产发布。** 前端静态资源走 S3+CloudFront，后端走 API Gateway + Lambda（别名 `live` + Canary 渐进发布 + 错误率告警自动回滚）。

## 前置门禁（不满足即停止）
1. `.wz/state/gate.json` 的 **G6=passed**（review 通过、无未处理 P0/P1）。
2. 分支干净、与目标环境对应（preview/staging 可自动；prod 必须人工批准）。
3. AWS 凭证与目标账户/区域已就绪（`aws sts get-caller-identity` 可验证），否则报 BLOCKER。
4. 解析 `--env`；缺省 `preview`。

## 流程
### 1. 构建产物
- 后端：`npm run build -w services/api`（或交给 CDK 的 NodejsFunction esbuild 打包，含 domain 层）。
- 前端：`npm run build -w apps/web` → 产出 `apps/web/dist`，部署阶段同步到 S3 站点桶。

### 2. 生成部署计划（diff / plan）
```bash
cd scaffold/infrastructure && npx cdk diff Wz-<env> -c env=<env>
```
解析输出并**高亮**：资源删除、IAM 权限扩大、数据库/存储变化、Lambda 配置变更。`--dry-run` 到此为止，仅输出计划与差异，不实际部署。

### 3. 部署到 preview / staging 并冒烟
```bash
npx cdk deploy Wz-<env> -c env=<env>            # preview 可 --require-approval never
node ../services/api/scripts/smoke.mjs <ApiUrl> # 读 CfnOutput 的 ApiUrl
```
冒烟覆盖：`GET /health` 200；`POST /sessions` 有效→201、缺字段→400、错误凭证→401；前端首页可加载。失败 → 终止，回退 `/wz:ai` 修复。

### 4. 人工批准（prod 强制）
输出部署计划摘要 + 差异 + 冒烟结果，**等待人工批准**。prod 未获批准不得继续。

### 5. Lambda 别名 Canary 发布
- preview：直接全量发布到别名 `live`。
- staging：`LINEAR_10PERCENT_EVERY_1MINUTE` 渐进切流。
- prod：`CANARY_10PERCENT_5MINUTES`（先 10% 流量观察 5 分钟，再全量）。
- 由 CodeDeploy 控制别名版本切换，绑定 CloudWatch 错误率告警。

### 6. 指标校验与自动回滚
观察别名版本的错误率、P95、冷启动、关键业务指标。**告警触发 → CodeDeploy 自动回滚到上一版本**；也可手动 `cdk deploy` 上一个 commit 或将别名指回旧版本。

### 7. 写发布记录
生成 `docs/evidence/deployment-record.md`（模板 `.wz/templates/deployment-record.md`）：环境、版本/别名、Commit、CFN 变更摘要、冒烟结果、回滚点、批准人。更新 `.wz/state/gate.json` 的 G7 与 `run.json`。

## 环境策略
| 环境 | 触发 | 发布方式 | 审批 |
|---|---|---|---|
| preview | 任意 feature 分支 | 全量 | 无需 |
| staging | 集成完成 | Linear 渐进 | 团队 |
| prod | G6 通过 | Canary 10%/5min + 自动回滚 | 强制人工 |

## 禁止
- 无 Gate / 无人工批准做生产发布；控制台手工漂移；把静态前端塞进 Lambda；明文密钥（走 SSM/Secrets Manager）。

## 输出与 Gate
- 产物：CFN 变更集、`deployment-record.md`、回滚点。
- `G7`：目标环境部署成功、冒烟通过、指标正常（或已回滚并记录）。
下一步：`/wz:observe`（持续监控与反馈）。
