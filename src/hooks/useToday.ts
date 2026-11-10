import { useEffect, useState } from 'react';

import { getToday, getUpcomingProgrammes, getWhole } from '@/api/today';
import { getDevotional, getSermons } from '@/api/word';
import type { Devotional, Sermon } from '@/api/word-protocol';
import {
  isConfirmed,
  isFirstVisit,
  weekWindow,
  type DateWindow,
  type LeadAction,
  type UpcomingProgramme,
  type WholeActivity,
} from '@/api/today-protocol';
import { ApiError } from '@/auth/api';
import { useAuth } from '@/auth/AuthProvider';

export type TodayData = {
  /** null = that section failed to load. */
  lead: LeadAction | null;
  /** Confirmed upcoming commitments only (no waitlist/pending). */
  plans: UpcomingProgramme[] | null;
  /** No confirmed plans or Circle membership yet → show "Start here". */
  firstVisit: boolean;
  week: WholeActivity | null;
  weekWindow: DateWindow;
  /** "Make room for the Word" — empty when unavailable. */
  sermons: Sermon[];
  devotional: Devotional | null;
  /** Nothing could be reached at all → show the offline card. */
  offline: boolean;
};

const isNetworkFailure = (r: PromiseSettledResult<unknown>) =>
  r.status === 'rejected' && !(r.reason instanceof ApiError);

/** Loads the Today screen's three sections in parallel; each can fail on its own. */
export function useToday() {
  const { withSession } = useAuth();
  const [token, setToken] = useState(0); // bump to reload
  const [refreshing, setRefreshing] = useState(false);
  const [result, setResult] = useState<{ token: number; data: TodayData } | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const window = weekWindow(new Date());
      const [today, plans, week, sermons, devotional] = await Promise.allSettled([
        withSession(getToday),
        withSession((s) => getUpcomingProgrammes(s)),
        withSession((s) => getWhole(s, window)),
        // Web-API routes: errors are swallowed *inside* the call so a 401/403 here
        // only hides the Word section instead of signing the member out.
        withSession((s) => getSermons(s).catch((): Sermon[] => [])),
        withSession((s) => getDevotional(s).catch(() => null)),
      ]);
      if (!active) return;
      const confirmed = plans.status === 'fulfilled' ? plans.value.filter(isConfirmed).slice(0, 3) : null;
      const phase = today.status === 'fulfilled' ? today.value.membershipPhase : null;
      setResult({
        token,
        data: {
          lead: today.status === 'fulfilled' ? today.value.lead : null,
          plans: confirmed,
          firstVisit: isFirstVisit(phase, confirmed?.length ?? 0),
          week: week.status === 'fulfilled' ? week.value : null,
          weekWindow: window,
          sermons: sermons.status === 'fulfilled' ? sermons.value : [],
          devotional: devotional.status === 'fulfilled' ? devotional.value : null,
          offline: [today, plans, week].every(isNetworkFailure),
        },
      });
      setRefreshing(false);
    })();
    return () => {
      active = false;
    };
  }, [token, withSession]);

  return {
    data: result?.data ?? null,
    // Pull-to-refresh keeps current content visible; other reloads show the skeleton.
    loading: result?.token !== token && !refreshing,
    refreshing,
    reload: () => setToken((t) => t + 1),
    refresh: () => {
      setRefreshing(true);
      setToken((t) => t + 1);
    },
  };
}
