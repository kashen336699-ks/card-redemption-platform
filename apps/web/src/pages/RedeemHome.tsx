import { useEffect, useState } from 'react';
import type { RedeemApi } from '../api/client.js';
import type { RedeemSuccess, ErrorResponse } from '@card/contracts';
import { validateCode, normalizeCode, genRequestId } from '../api/normalize.js';
import { track } from '../analytics/track.js';
import { BrandHeader } from '../components/BrandHeader.js';
import { SubmitButton } from '../components/SubmitButton.js';

interface Props {
  api: RedeemApi;
  onSuccess: (r: RedeemSuccess) => void;
  onError: (e: ErrorResponse) => void;
}

// 兑换首页（FR-001/002/003/009、UX-001/002/003）。还原原型 redeem-home.html。
export function RedeemHome({ api, onSuccess, onError }: Props) {
  const [code, setCode] = useState('');
  const [hint, setHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    track({ name: 'page_view', device: window.innerWidth < 768 ? 'mobile' : 'desktop' });
  }, []);

  const submit = async () => {
    const v = validateCode(code); // FR-002 前端校验
    const attemptIndex = attempts + 1;
    setAttempts(attemptIndex);
    track({ name: 'code_submit', format_valid: !v, attempt_index: attemptIndex });
    if (v) {
      setHint(v);
      return;
    }
    setHint(null);
    setLoading(true); // FR-003 加载态，禁重复提交
    const started = Date.now();
    try {
      const outcome = await api.submit({
        code: normalizeCode(code),
        request_id: genRequestId(), // 幂等键（带回退）
        client_ts: Date.now(),
      });
      const latency = Date.now() - started;
      if (outcome.kind === 'success') {
        track({ name: 'redeem_result', result_code: 'REDEEMED', product_sku: outcome.data.product.name, latency });
        onSuccess(outcome.data);
      } else if (outcome.kind === 'error') {
        track({ name: 'redeem_result', result_code: outcome.data.error_code, latency });
        onError(outcome.data);
      } else {
        onError({ error_code: 'SYSTEM_ERROR', message: '处理中，请稍后在结果页查看', action: 'resubmit' });
      }
    } catch {
      onError({ error_code: 'SYSTEM_ERROR', message: '系统开小差了，本次未消耗卡密', action: 'resubmit' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative z-[1] flex min-h-screen flex-col items-center p-6 lg:p-12">
      <BrandHeader />

      <h1 className="text-[30px] font-extrabold leading-tight">输入卡密，立即领取你的商品</h1>
      <p className="mb-1 max-w-[520px] text-ink-muted">
        粘贴闲鱼订单收到的卡密，系统将自动识别商品并安全交付。
      </p>

      <section className="my-[18px] flex w-full max-w-[520px] flex-wrap gap-3" aria-label="价值说明">
        <Prop title="低门槛" desc="无需注册登录" />
        <Prop title="强确定" desc="明确商品与兑换结果" />
        <Prop title="高安全" desc="卡密脱敏 · 防重放" />
      </section>

      <section
        className="w-full max-w-[520px] rounded-card border border-line bg-card p-7 shadow-card"
        aria-label="卡密兑换"
      >
        <label htmlFor="code" className="mb-2 block text-[13px] text-ink-muted">
          卡密（粘贴或输入，自动忽略空格与大小写）
        </label>
        <input
          id="code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            if (hint) setHint(null);
          }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          autoComplete="off"
          placeholder="ABCD-EFGH-JKLM-NPQR"
          aria-describedby="code-hint"
          aria-invalid={hint ? true : undefined}
          className="w-full rounded-input border border-line bg-input px-4 py-[14px] text-[17px] tracking-[3px]
            text-ink outline-none placeholder:tracking-[2px] placeholder:text-[#565676]
            focus:border-line-focus focus:shadow-[0_0_0_3px_rgba(45,212,191,.25)]"
        />
        <p id="code-hint" role="alert" className="mt-2 min-h-[18px] px-[2px] text-[13px] text-danger">
          {hint}
        </p>

        <SubmitButton loading={loading} disabled={false} onClick={submit} />

        <div className="mt-4 flex items-start gap-2 text-[13px] text-ink-muted">
          <span className="text-safe">●</span>
          <span>我们不会在链接中传递卡密；交付信息请勿转发他人。</span>
        </div>
      </section>

      <footer className="mt-7 max-w-[520px] text-center text-[13px] text-ink-muted">
        遇到问题？失败时页面会提供售后入口。本服务全程 HTTPS 加密。
      </footer>
    </main>
  );
}

function Prop({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex-1 basis-[150px] rounded-input border border-line bg-card px-[14px] py-3 text-[13px]">
      <b className="mb-[2px] block text-safe">{title}</b>
      {desc}
    </div>
  );
}
