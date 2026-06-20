# L2 项目规则（按项目覆盖）

## 目录与命名
- 前端：`scaffold/apps/web`；后端：`scaffold/services/api`；基础设施：`scaffold/infrastructure`。
- 文件 kebab-case；React 组件 PascalCase；类型/接口 PascalCase；常量 UPPER_SNAKE。

## 领域模型
> 在此填写本项目实体、状态机、关键业务规则（由 /wz:design 生成 architecture.md 后回填）。

## 禁止事项（项目级）
- 不在前端硬编码 API 地址，统一走环境变量 `VITE_API_BASE_URL`。
- 不绕过 API 契约（`docs/contracts/openapi.yaml`）私自加字段。
- 不在未冻结契约前编写前后端最终集成代码。

## 任务约束（L3，写在 tasks.md 的每个任务内）
每个任务必须声明：允许修改的文件范围、关联需求 ID、验证命令、完成证据路径。
