# L1 技术栈规则 — AWS Lambda 后端

## 分层
- Handler 只做协议适配（解析事件、校验、组装响应）。
- 业务逻辑放可单测的 `domain/` 层，不依赖 AWS SDK 与 HTTP。
- 数据访问独立成 repository，便于替换 DynamoDB / Aurora。

## 工程规则
- 函数无状态；连接 / SDK Client 在容器复用范围缓存（模块级初始化）。
- 统一结构化错误码 + Correlation ID + 统一日志字段（JSON 日志）。
- IAM 最小权限；环境变量不存明文密钥。
- 高耗时 AI 请求**不得**靠单次同步 Lambda 完成 → 改异步任务返回 `job_id`（SQS / Step Functions）。

## 部署边界
- 静态前端 → S3 + CloudFront，禁止塞进 Lambda。
- HTTP 接口 → API Gateway + Lambda。
- 长流程 → Step Functions；削峰解耦 → SQS + Worker Lambda。
- 基础设施只通过 CDK 管理，禁止控制台手工漂移。

## 测试
- domain 层单元测试覆盖率门槛 ≥ 80%。
- handler 层用本地事件 fixture 做集成测试。
