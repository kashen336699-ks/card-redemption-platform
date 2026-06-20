// 部署冒烟（G7）：对部署后的 ApiUrl 验证端点可达性、负路径错误码、安全头。
// 成功路径需先导入卡密+库存（见 README 导入脚本），故此处只测可达性与负路径。
// 用法：node services/api/scripts/smoke.mjs <ApiUrl>
//   ApiUrl 取 cdk 输出的 ApiUrl，例如 https://xxxx.execute-api.<region>.amazonaws.com
const base = (process.argv[2] || '').replace(/\/$/, '');
if (!base) {
  console.error('usage: node smoke.mjs <ApiUrl>');
  process.exit(1);
}
const api = `${base}/api/v1`;
const uuid = () => crypto.randomUUID();
const post = (path, body) =>
  fetch(`${api}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

let failed = 0;
const check = (name, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`);
  if (!cond) failed++;
};

// 1) 端点可达 + 输入校验（非法卡密 → 422）
{
  const r = await post('/redemptions', { code: 'x', request_id: uuid() });
  check('POST /redemptions 可达 + 非法输入→422', r.status === 422, `status=${r.status}`);
  check('SEC-003 HSTS 头存在', !!r.headers.get('strict-transport-security'));
  check('Content-Type JSON', (r.headers.get('content-type') || '').includes('application/json'));
}
// 2) 不存在卡密 → 409 INVALID_CODE（合法格式但查无）
{
  const r = await post('/redemptions', { code: 'ZZZZ-ZZZZ-ZZZZ-ZZZZ', request_id: uuid() });
  const body = await r.json().catch(() => ({}));
  check('不存在卡密→稳定错误码', r.status === 409 || r.status === 429, `status=${r.status}`);
  check('SEC-004 响应无内部字段', !/inventory|sku|stack|dynamo|hmac/i.test(JSON.stringify(body)));
}
// 3) GET 未知兑换编号 → 404
{
  const r = await fetch(`${api}/redemptions/RDM-NOT-EXIST`);
  check('GET /redemptions/{id} 未知→404', r.status === 404, `status=${r.status}`);
}
// 4) 售后查询（无匹配 → 404）
{
  const r = await post('/support/lookup', { code_last4: 'ZZZZ' });
  check('POST /support/lookup 可达', r.status === 404 || r.status === 200, `status=${r.status}`);
}

console.log(failed === 0 ? '\nSMOKE PASS' : `\nSMOKE FAILED (${failed})`);
process.exit(failed === 0 ? 0 : 1);
