# 工作流改进补丁（反哺 .claude）

> 这两处改进来自本次实战踩坑（见 `.wz/memory/lessons.md` 2026-06-19）：
> ① `vitest 绿 ≠ build 绿` → G5 verify 纳入构建+类型检查；② 前后端分离 CDK 默认配 CORS。
> 因 `.claude/` 受保护，AI 工具无法直接改，故放此处由你覆盖。

## 应用（在你的终端执行）
```bash
cd ~/Desktop/lession/class2/project2

# ① G5 verify：加入「构建与类型检查」维度 + 跨域 CORS 接口验证
cp docs/workflow-patches/verify.md .claude/commands/wz/verify.md

# ② aws-cdk-iac skill：CORS 默认开 + ESM 打包规范
cp docs/workflow-patches/aws-cdk-iac-SKILL.md .claude/skills/aws-cdk-iac/SKILL.md

# 提交
git add -A && git commit -m "chore(workflow): G5 纳入 build/typecheck；CDK 默认 CORS（反哺踩坑经验）"
git push
```

## 改了什么
- `verify.md`：验证维度新增「2. 构建与类型（强制）」——`npm run build`(含 `tsc -b`) + `npm run typecheck`；接口维度补「跨域 CORS 预检」；G5 Gate 增加构建通过条件。
- `aws-cdk-iac/SKILL.md`：规则新增「CORS 默认开」（HttpApi corsPreflight 示例，prod 收紧来源）与「ESM 打包用 OutputFormat.ESM」；验证补 CORS 预检。

## 备注
- 应用后这套改进对**后续任何用此工作流的新项目**生效，避免重蹈本次两坑。
- CI（`.github/workflows/ci.yml`）已把 test + typecheck + build + synth 固化到 PR，与 G5 的新维度呼应。
