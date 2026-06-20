---
name: aws-cdk-iac
description: 用 AWS CDK (TypeScript) 定义并部署基础设施——S3+CloudFront 前端、API Gateway+Lambda、IAM、日志、SQS/Step Functions。当任务涉及部署、基础设施、CDK 栈或 AWS 资源时使用。
---

# AWS CDK 基础设施

## 部署边界
| 层 | 服务 | 说明 |
|---|---|---|
| 前端 | S3 + CloudFront | 静态 React 构建，禁止塞进 Lambda |
| API | API Gateway + Lambda | HTTP 接口与认证 |
| 数据 | DynamoDB / Aurora Serverless | 按访问模式选其一，禁止默认混用 |
| 异步 | SQS + Worker Lambda | 重试、削峰、解耦 |
| 长流程 | Step Functions | 多步骤、等待、补偿 |
| 观测 | CloudWatch + X-Ray | 日志、指标、Trace、告警 |
| 配置 | SSM / Secrets Manager | 参数与密钥 |

## 规则
- 一切资源经 CDK，禁止控制台手工漂移。
- IAM 最小权限，逐函数授权；不要 `*` 资源/动作。
- 每个环境（preview/staging/prod）独立 stack 或 context，参数隔离。
- 部署前 `cdk diff`，在部署计划中高亮：资源删除、权限扩大、数据库变化。
- Lambda 用别名 + 版本，支持 Canary 流量切换与回滚。

## 验证
`cdk synth` 必须通过；产出 CloudFormation 模板作为可部署性证据。
