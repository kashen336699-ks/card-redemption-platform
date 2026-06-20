import { useState } from 'react';
import type { RedeemSuccess, ErrorResponse } from '@card/contracts';
import { resolveApi } from './api/mock.js';
import { RedeemHome } from './pages/RedeemHome.js';
import { RedeemResult } from './pages/RedeemResult.js';

type View =
  | { name: 'home' }
  | { name: 'success'; data: RedeemSuccess }
  | { name: 'error'; data: ErrorResponse };

const api = resolveApi();

// 兑换中心 SPA：home → success / error。无路由库，用视图状态切换（轻量 MVP）。
export function App() {
  const [view, setView] = useState<View>({ name: 'home' });

  if (view.name === 'success')
    return <RedeemResult variant="success" data={view.data} onBack={() => setView({ name: 'home' })} />;
  if (view.name === 'error')
    return <RedeemResult variant="error" data={view.data} onBack={() => setView({ name: 'home' })} />;

  return (
    <RedeemHome
      api={api}
      onSuccess={(data) => setView({ name: 'success', data })}
      onError={(data) => setView({ name: 'error', data })}
    />
  );
}
