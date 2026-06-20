// 品牌导航（还原原型 .brand）
export function BrandHeader() {
  return (
    <header className="mb-7 flex w-full max-w-[1040px] items-center gap-[10px]">
      <div className="h-[34px] w-[34px] rounded-[10px] bg-gradient-to-br from-primary to-safe" />
      <div className="text-[18px] font-bold tracking-wide">兑换中心</div>
      <div className="ml-auto text-[13px] text-ink-muted">安全 · 即时 · 免注册</div>
    </header>
  );
}
