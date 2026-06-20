# Review Findings（结构化，Reviewer 输出，不改代码）

> 同时输出机器可读 `findings.json`，结构见下。Builder 只针对 findings 定向修复，最多两轮。

```json
{
  "review_id": "RV-001",
  "target_diff": "git range or PR",
  "reviewed_specs": ["FR-001", "SEC-001"],
  "findings": [
    {
      "id": "F-001",
      "severity": "P0|P1|P2|P3",
      "category": "correctness|security|regression|a11y|visual|style",
      "file": "services/api/src/handlers/sessions.ts",
      "line": 42,
      "requirement_id": "SEC-001",
      "problem": "未认证请求未返回 401",
      "evidence": "test output / screenshot path",
      "suggested_fix": "在 handler 入口校验 token",
      "auto_fixable": false
    }
  ],
  "release_recommendation": "block|fix-then-ship|ship",
  "human_gate_required": true
}
```

## 自动修复边界
- 仅 P2/P3 且范围明确可自动建修复任务。
- 权限、数据迁移、计费、安全策略、生产配置**不得**自动合并。
- 每次修复后重跑受影响测试，禁止仅凭文本判断完成。
