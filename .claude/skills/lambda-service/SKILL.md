---
name: lambda-service
description: 实现 AWS Lambda 后端服务（TypeScript），按 handler/domain/repository 分层、对齐 OpenAPI 契约。当任务涉及后端接口、Lambda 函数、业务逻辑或数据访问时使用。
---

# Lambda 服务实现

## 分层（强制）
- `handlers/`：协议适配——解析 API Gateway 事件、入参校验、组装 HTTP 响应、错误映射。
- `domain/`：纯业务逻辑，可单测，不依赖 AWS SDK 与 HTTP。
- `repository/`：数据访问，隔离 DynamoDB/Aurora，便于替换与 mock。

## 规则
- 函数无状态；SDK Client / 连接在模块级初始化以复用容器。
- 统一结构化错误码 + Correlation ID + JSON 结构化日志字段。
- IAM 最小权限；环境变量不存明文密钥（走 SSM / Secrets Manager）。
- 高耗时 AI 请求不靠单次同步 Lambda → 入队 SQS / 启动 Step Functions，立即返回 `job_id`。
- 严格按 `docs/contracts/openapi.yaml` 实现请求/响应/错误码，不私自加字段。

## 测试
- domain 单测覆盖率 ≥ 80%（正常/空/错误/边界）。
- handler 用本地 API Gateway 事件 fixture 做集成测试（含未认证返回 401 等安全用例）。

## 输出
代码 + 单测 + `docs/evidence/changelog-<task>.md`（变更摘要、关联需求 ID、验证命令与结果）。
