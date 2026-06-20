interface Props {
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}

// 兑换按钮状态机（FR-003）：default / hover / loading / disabled；加载时不可重复提交。
export function SubmitButton({ loading, disabled, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading}
      className="mt-[18px] w-full rounded-input px-[18px] py-[14px] text-[16px] font-bold text-white
        bg-primary transition-colors hover:bg-primary-hover active:translate-y-px
        disabled:cursor-not-allowed disabled:bg-[#3A3358] disabled:text-[#8E8AB0]
        focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-safe"
    >
      {loading && (
        <span
          aria-hidden
          className="mr-2 inline-block h-[15px] w-[15px] -translate-y-px animate-spin rounded-full border-2 border-white/40 border-t-white align-[-2px]"
        />
      )}
      {loading ? '处理中…' : '立即兑换'}
    </button>
  );
}
