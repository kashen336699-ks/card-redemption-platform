# 发布记录（deployment-record.md）

| 项 | 值 |
|---|---|
| 环境 | preview / staging / prod |
| 日期 | {YYYY-MM-DD HH:mm} |
| Commit | {git sha} |
| Lambda 别名 / 版本 | live → v{N} |
| 发布方式 | 全量 / Linear / Canary 10%/5min |
| 批准人 | {人工 Gate} |

## CloudFormation 变更摘要
- 新增 / 修改 / **删除**（高亮）：
- IAM 权限变化：
- 数据/存储变化：

## 冒烟结果
- GET /health: {200} · POST /sessions 201/400/401: {pass} · 前端首页: {ok}

## 指标（发布后观察窗）
- 错误率 / P95 / 冷启动 / 关键业务指标：

## 回滚点
- 上一稳定版本：v{N-1}（别名回指或 `cdk deploy <prev-commit>`）
- 自动回滚：CloudWatch 错误率告警触发 CodeDeploy 自动回退（已配置）

## 结论
- G7：passed / rolled-back（附原因）
