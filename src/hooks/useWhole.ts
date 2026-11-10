import { useEffect, useState } from 'react';

import { getWhole } from '@/api/today';
import { monthWindow, weekWindow, type DateWindow, type WholeActivity } from '@/api/today-protocol';
import { useAuth } from '@/auth/AuthProvider';

export type Period = 'week' | 'month';

type Result = { key: string; activity: WholeActivity | null; error: string | null };

/** GET /mobile/me/whole for one week or month, shifted by `offset` periods. */
export function useWhole(period: Period, offset: number, reloadToken = 0) {
  const { withSession } = useAuth();
  const window: DateWindow = period === 'week' ? weekWindow(new Date(), offset) : monthWindow(new Date(), offset);
  const key = `${window.from}|${window.to}|${reloadToken}`;
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    let active = true;
    const [from, to] = key.split('|');
    withSession((s) => getWhole(s, { from, to })).then(
      (activity) => active && setResult({ key, activity, error: null }),
      (e: unknown) =>
        active && setResult({ key, activity: null, error: e instanceof Error ? e.message : 'Could not load activity.' }),
    );
    return () => {
      active = false;
    };
  }, [key, withSession]);

  const current = result?.key === key ? result : null;
  return { window, loading: !current, activity: current?.activity ?? null, error: current?.error ?? null };
}
