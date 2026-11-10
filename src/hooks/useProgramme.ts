import { useEffect, useState } from 'react';

import { getProgramme } from '@/api/programmes';
import type { ProgrammeDetail } from '@/api/programmes-protocol';
import { useAuth } from '@/auth/AuthProvider';

type Result = { key: string; programme: ProgrammeDetail | null; error: string | null };

/** GET /mobile/programmes/{slug}. `reload()` refetches (e.g. after registering). */
export function useProgramme(slug: string | undefined) {
  const { withSession } = useAuth();
  const [token, setToken] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const key = `${slug}|${token}`;

  useEffect(() => {
    if (!slug) return;
    let active = true;
    withSession((s) => getProgramme(s, slug)).then(
      (programme) => active && setResult({ key, programme, error: null }),
      (e: unknown) =>
        active && setResult({ key, programme: null, error: e instanceof Error ? e.message : 'This programme could not be loaded.' }),
    );
    return () => {
      active = false;
    };
  }, [key, slug, withSession]);

  const current = result?.key === key ? result : null;
  return {
    // Keep showing the previous data while a reload is in flight.
    programme: current?.programme ?? result?.programme ?? null,
    loading: !current,
    error: current?.error ?? null,
    reload: () => setToken((t) => t + 1),
  };
}
