# LESSONS.md — 架构决策与踩坑记录（每个 task 开工前必读）

> 仅记录架构决策及理由、踩坑、跨 feature 影响、环境/依赖特殊处理；常规开发不记。
> 格式：`## {日期} — {feature}/{task}`

## 2026-06-19 — G7 部署构建（vitest 绿 ≠ build 绿）
- `npm run build` 的 `tsc -b` 比 vitest(esbuild) 严：暴露两类 vitest 没抓到的错。
  ① `import.meta.env` 需 `src/vite-env.d.ts`（`/// <reference types="vite/client" />` + 声明 VITE_ 变量）；tsconfig 设了 `types:[...]` 会限制自动引入，必须显式 reference。
  ② 多个字面量 `status` 的类型做 `&` 交叉会坍缩成 `never`；判别联合应取字段后按需 `as`，不要交叉。
- 教训：G5/G6 应把 `npm run build`（含 tsc）纳入验证，而不仅 vitest，避免部署时才暴露类型错。
- 部署：CDK NodejsFunction(ESM) + DynamoDB/KMS/Secret/APIGW/S3/CloudFront 一套 synth→deploy 在真实账号 192s 完成；冒烟 7/7。

## 2026-06-19 — G6 review 三处缺陷（独立审查价值）
- F-101(P1/SEC-006)：幂等记录(IDEMP)误存交付明文 → 弱化字段级加密。修：只存 KMS 密文 + 商品视图，reconstructSuccess() 在重放/GET 时解密。安全数据流变更属 SECURITY_HOLD，经用户裁决后再改。
- F-102(P1/FR-207)：兑换记录 GSI1PK 用 cardHmac 末四位(hex)，售后查询用卡密明文末四位 → 永远查不到。修：卡密规范化末四位 lastFour(code) 贯通到 GSI1PK 与 masked_code。
- F-103(P2/FR-105)：DynamoDB Query Limit:1 在 FilterExpression 之前生效，首项被过滤会误判 NO_STOCK。修：去 Limit，由服务端 Filter 返回可用项。
- 教训：①DynamoDB Limit 与 Filter 顺序坑；②查询键与存储键必须同源（hmac vs 明文末四位）；③派生数据（响应）落库前审视是否含解密后的敏感内容。

## 2026-06-19 — G4/1.redeem-frontend 测试（本地真实环境）
- 后端 vitest 34/34 通过；CDK `synth` 成功；前端初次 2 红。
- 根因：`getByLabelText(/卡密/)` 正则太宽——"卡密"在标题/标签/安全提示多处出现 → "Found multiple elements"。组件 a11y 本身正确（label↔input 关联无误），是测试查询不具唯一性。
- 修法：改用 `getByRole('textbox', { name: /卡密/ })`（页面唯一 textbox，稳定且仍校验可访问名）。
- 另：`crypto.randomUUID()` 加 `genRequestId()` 回退（非安全上下文/老环境无 randomUUID），稳健性提升。
- 教训：组件测试查询用 role 优先于宽松文本正则；UI 文案里高频词（如"卡密"）易致文本匹配歧义。

## 2026-06-19 — G4 环境/构建（沙箱限制 + 验证策略）
- 挂载目录跑 `npm install` 极慢/不稳（node_modules 数万小文件经挂载层写入受限），全量 vitest/vite/cdk 在沙箱不可靠。
- 策略：业务纯逻辑（domain 状态机/幂等/HMAC 规范化，按 lambda.md 本就不依赖 AWS SDK）用 Node 22 `node --experimental-strip-types xxx.ts` 直跑断言验证（零依赖）；handler/repository/React/CDK 写真实代码，全量 build/test/synth 由用户本地原生环境执行。
- 跨 `.ts` 导入在 strip-types 下需用 `.ts` 结尾或绝对路径具体定位。

## 2026-06-19 — 环境/git（沙箱限制）
- 挂载到 Linux 沙箱的项目目录，沙箱 shell 对 `.git` 内文件无 unlink 权限（git add 后残留 `.git/index.lock` 删不掉，commit 会失败）。
- 处置：git 写操作（stage/commit/清 lock）一律在用户原生终端执行；AI 侧只读 git 状态。/wz:ai 的"小步提交"由用户在终端完成或单独脚本。
- 残留 lock 清理：用户终端 `rm -f .git/index.lock`。

## 2026-06-19 — G1/prd 架构裁决（卡密兑换平台）
- 存储选 DynamoDB：幂等用 ConditionExpression，原子用 TransactWriteItems；不引入关系库（避 Lambda 连接池问题）。SEC-002 的"并发只成功一次"靠条件更新 + 唯一约束，前端防重不可替代。
- 密钥 KMS + Secrets Manager 与数据分离（SEC-001/006）；MVP 后台降级为单管理员口令，RBAC 后置。
- 保留期 90 天，用 DynamoDB TTL 自动清理（FR-301/SEC-007）。
- MVP-1 不含管理后台，卡密/商品用脚本导入；后台进 MVP-2。详见 ADR-0001。

## 2026-06-14 — 1.user-login/T-020
- handler 只做协议适配，业务全部下沉 domain，使 domain 单测无需 mock AWS（提升可测性）。
- 401 不区分"用户不存在/密码错"，防账号枚举（SEC-001）。
