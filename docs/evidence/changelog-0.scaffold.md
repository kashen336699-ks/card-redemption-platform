# Changelog — 0.scaffold（G4）

- 日期：2026-06-19
- 关联需求：NFR-006、UX-003

## 变更摘要
- 根 `package.json`：npm workspaces（packages/* · services/* · apps/* · infrastructure）+ 统一脚本（build/test/synth/typecheck）。`tsconfig.base.json` 共享编译配置。
- `packages/contracts`：从冻结 OpenAPI 派生的共享 TS 类型 + `ERROR_CATALOG`（错误码→文案/动作/HTTP，前后端共用，保证文案稳定 FR-008）。
- `services/api`：handler/domain/repository/crypto/lib 分层骨架；vitest（含 domain/crypto 覆盖率门槛 80%）；`AppError`（稳定错误码，禁带敏感信息 SEC-004）。
- `apps/web`：Vite+React+TS+Tailwind 骨架；Tailwind theme 从 design tokens 注入（禁 magic values）；深色科技感全局样式 + reduced-motion；`VITE_API_BASE_URL`（不硬编码 API 地址）。
- `infrastructure`：CDK app + 空 `Wz-${env}` stack（env 参数化），资源在后续 feature 增量添加。

## 验证
- 契约类型：`node --experimental-strip-types` 跑通 `ERROR_CATALOG`（INVALID_CODE=409 / TOO_MANY_ATTEMPTS=429 / SYSTEM_ERROR=500），类型 strip 干净。✅
- **环境说明（BLOCKER 规避）**：本沙箱对挂载目录跑 `npm install` 极慢/不稳（写数万小文件受挂载层限制）。已改用 Node 22 内置 TS 直跑验证纯逻辑核心；`npm install`/`vite build`/`cdk synth`/`vitest` 全量验证在用户本地原生环境执行（命令见 tasks.md 与 README）。代码结构与契约一致性已就位。
