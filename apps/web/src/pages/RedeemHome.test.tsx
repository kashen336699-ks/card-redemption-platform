import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RedeemHome } from './RedeemHome.js';
import type { RedeemApi } from '../api/client.js';

const okApi: RedeemApi = {
  submit: vi.fn(async () => ({
    kind: 'success' as const,
    data: {
      redemption_id: 'RDM-X',
      status: 'REDEEMED' as const,
      product: { name: 'P', delivery_type: 'code' as const },
      delivery: { type: 'code' as const, text: 'AAAA' },
    },
  })),
  poll: vi.fn(),
};

describe('RedeemHome（FR-002/003、UX-002）', () => {
  it('UX-002: 输入框有可访问 label', () => {
    render(<RedeemHome api={okApi} onSuccess={vi.fn()} onError={vi.fn()} />);
    // 唯一 textbox，可访问名来自关联 label「卡密（…）」
    expect(screen.getByRole('textbox', { name: /卡密/ })).toBeInTheDocument();
  });

  it('FR-002: 空/非法卡密即时提示且不调用 API', () => {
    const onSuccess = vi.fn();
    render(<RedeemHome api={okApi} onSuccess={onSuccess} onError={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /立即兑换/ }));
    expect(screen.getByRole('alert')).toHaveTextContent('请输入卡密');
    expect(okApi.submit).not.toHaveBeenCalled();
  });

  it('FR-004: 合法卡密提交成功 → 触发 onSuccess', async () => {
    const onSuccess = vi.fn();
    render(<RedeemHome api={okApi} onSuccess={onSuccess} onError={vi.fn()} />);
    fireEvent.change(screen.getByRole('textbox', { name: /卡密/ }), {
      target: { value: 'ABCD-EFGH-JKLM-NPQR' },
    });
    fireEvent.click(screen.getByRole('button', { name: /立即兑换/ }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });
});
