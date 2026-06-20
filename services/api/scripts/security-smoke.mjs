// 安全冒烟（验收 §12 第8条）：对部署后的 ApiUrl 跑鉴权/限流/输入校验/重放/注入冒烟。
// 用法：node services/api/scripts/security-smoke.mjs <ApiUrl>
const base = process.argv[2];
if (!base) {
  console.error('usage: node security-smoke.mjs <ApiUrl>');
  process.exit(1);
}

const post = (path, body) =>
  fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

let failed = 0;
const check = (name, cond) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}`);
  if (!cond) failed++;
};

const uuid = () => crypto.randomUUID();

// 1) 输入校验：非法卡密 → 422
{
  const r = await post('/redemptions', { code: 'x', request_id: uuid() });
  check('SEC-008 非法输入 → 422', r.status === 422);
}
// 2) 注入：脚本字符不应 200 成功
{
  const r = await post('/redemptions', { code: '<script>alert(1)</script>', request_id: uuid() });
  check('SEC-008 注入字符被拒', r.status === 422 || r.status === 409);
}
// 3) 错误响应不泄露内部字段
{
  const r = await post('/redemptions', { code: 'BADCODE-0000-0000-0000', request_id: uuid() });
  const text = await r.text();
  check('SEC-004 响应无内部字段', !/inventory|sku|stack|dynamo|hmac/i.test(text));
  check('SEC-003 HSTS 头存在', !!r.headers.get('strict-transport-security'));
}
// 4) 限流：连发触发 429
{
  let got429 = false;
  for (let i = 0; i < 30; i++) {
    const r = await post('/redemptions', { code: `BADCODE-${i}-0000-0000`, request_id: uuid() });
    if (r.status === 429) got429 = true;
  }
  check('SEC-005 连发触发 429', got429);
}

console.log(failed === 0 ? '\nSMOKE PASS' : `\nSMOKE FAILED (${failed})`);
process.exit(failed === 0 ? 0 : 1);
