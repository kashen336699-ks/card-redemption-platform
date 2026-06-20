import { useState } from 'react';
import type { RedeemSuccess, ErrorResponse, Delivery } from '@card/contracts';
import { BrandHeader } from '../components/BrandHeader.js';

type Props =
  | { variant: 'success'; data: RedeemSuccess; onBack: () => void }
  | { variant: 'error'; data: ErrorResponse; onBack: () => void };

// 成功/失败共用卡片骨架（PRD 开发提示：失败态替换图标/标题/说明/主操作）。
// 还原原型 redeem-success.html / redeem-error.html。
export function RedeemResult(props: Props) {
  return (
    <main className="relative z-[1] flex min-h-screen flex-col items-center p-6 lg:p-12">
      <BrandHeader />
      <section
        className="w-full max-w-[520px] rounded-card border border-line bg-card p-7 shadow-card"
        aria-label={props.variant === 'success' ? '兑换成功' : '兑换失败'}
      >
        {props.variant === 'success' ? <Success data={props.data} /> : <Failure data={props.data} />}
        <BackLink onBack={props.onBack} variant={props.variant} />
      </section>
      <footer className="mt-7 max-w-[520px] text-center text-[13px] text-ink-muted">
        {props.variant === 'success'
          ? '如内容异常或无法使用，请通过售后入口联系商家，并提供兑换编号。'
          : '售后请提供卡密末四位、闲鱼订单号或兑换编号，便于快速定位。'}
      </footer>
    </main>
  );
}

function Success({ data }: { data: RedeemSuccess }) {
  return (
    <>
      <StatusIcon ok />
      <h1 className="text-center text-[22px] font-bold">兑换成功</h1>
      <p className="mb-[18px] text-center text-ink-muted">商品已交付，请妥善保存，勿转发他人。</p>

      <div className="border-t border-line pt-4">
        <div className="text-[13px] text-ink-muted">商品名称</div>
        <div className="mb-[10px] mt-[2px] text-[17px] font-bold">{data.product.name}</div>
        {data.product.spec && (
          <>
            <div className="text-[13px] text-ink-muted">有效期 / 规格</div>
            <div className="mt-[2px]">{data.product.spec}</div>
          </>
        )}
      </div>

      <DeliveryBlock delivery={data.delivery} />

      <p className="mt-2 text-center text-[13px] text-ink-muted">
        兑换编号 <b className="tracking-wide text-ink">{data.redemption_id}</b>（截图可用于售后查询）
      </p>
    </>
  );
}

function Failure({ data }: { data: ErrorResponse }) {
  return (
    <>
      <StatusIcon ok={false} />
      <h1 className="text-center text-[22px] font-bold">兑换未成功</h1>
      <p role="alert" className="mb-[18px] text-center text-ink-muted">
        {data.message}
      </p>
    </>
  );
}

// FR-006：按 delivery_type 渲染交付内容 + 一键复制（FR-007）
function DeliveryBlock({ delivery }: { delivery: Delivery }) {
  const content = delivery.text ?? delivery.url ?? delivery.guide ?? '';
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard?.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="my-[18px] flex items-center justify-between gap-3 rounded-input border border-dashed border-line bg-input px-4 py-[14px]">
      {delivery.url ? (
        <a href={delivery.url} className="break-all text-[16px] tracking-[2px] text-safe underline">
          打开领取链接
        </a>
      ) : (
        <code className="break-all text-[16px] tracking-[2px] text-ink">{content}</code>
      )}
      <button
        type="button"
        onClick={copy}
        aria-label="复制交付内容"
        className="whitespace-nowrap rounded-full border border-safe px-[14px] py-[6px] text-[13px] text-safe hover:bg-safe/10"
      >
        {copied ? '已复制' : '复制'}
      </button>
    </div>
  );
}

function StatusIcon({ ok }: { ok: boolean }) {
  return (
    <div
      aria-hidden
      className={
        'mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 text-[32px] font-bold ' +
        (ok ? 'border-safe bg-safe/15 text-safe' : 'border-danger bg-danger/10 text-danger')
      }
    >
      {ok ? '✓' : '!'}
    </div>
  );
}

// FR-009：失败页售后入口常驻
function BackLink({ onBack, variant }: { onBack: () => void; variant: 'success' | 'error' }) {
  return (
    <div className="mt-5 flex gap-3">
      <button
        type="button"
        onClick={onBack}
        className="flex-1 rounded-input border border-line px-4 py-3 text-center text-[13px] hover:border-safe hover:text-safe"
      >
        返回首页
      </button>
      {variant === 'error' && (
        <a
          href="#support"
          className="flex-1 rounded-input border border-line px-4 py-3 text-center text-[13px] hover:border-safe hover:text-safe"
        >
          联系售后
        </a>
      )}
    </div>
  );
}
