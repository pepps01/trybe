// Today-module endpoints. No React Native imports: runs under Node for tests.
import { request } from '../auth/api.ts';
import type { Session } from '../auth/protocol.ts';
import {
  describeShape,
  parseLeadAction,
  parseMembershipPhase,
  parseUpcoming,
  parseWhole,
  type DateWindow,
  type LeadAction,
  type UpcomingProgramme,
  type WholeActivity,
} from './today-protocol.ts';

const isDev = typeof __DEV__ !== 'undefined' && __DEV__;

/** Dev builds only: log the payload's structure (keys/types, no values) to confirm undocumented shapes. */
function logShape(label: string, json: unknown) {
  if (isDev) console.log(`[api shape] ${label}`, JSON.stringify(describeShape(json)));
}

function deviceTimezone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

/** GET /mobile/today → the hero card's lead action + the member's phase. */
export async function getToday(session: Session): Promise<{ lead: LeadAction; membershipPhase: string | null }> {
  const tz = deviceTimezone();
  const json = await request<{ leadAction?: unknown; plan?: unknown }>(
    `/mobile/today${tz ? `?timezone=${encodeURIComponent(tz)}` : ''}`,
    { token: session.access_token },
  );
  logShape('/mobile/today', json);
  const membershipPhase = parseMembershipPhase(json?.plan);
  const lead = parseLeadAction(json?.leadAction);
  // Enum-like values, not personal data: log them so we can confirm the vocabulary.
  if (isDev) console.log(`[api value] membershipPhase=${membershipPhase} leadAction.status=${(json?.leadAction as { status?: unknown } | undefined)?.status}`);
  return { lead, membershipPhase };
}

/** GET /mobile/me/programmes?view=upcoming → the member's next registrations (any status). */
export async function getUpcomingProgrammes(session: Session, limit = 10): Promise<UpcomingProgramme[]> {
  const json = await request(`/mobile/me/programmes?view=upcoming&limit=${limit}`, { token: session.access_token });
  logShape('/mobile/me/programmes', json);
  const rows = parseUpcoming(json);
  if (isDev && rows.length) console.log(`[api value] programme states=${[...new Set(rows.map((r) => r.state))].join(',')}`);
  return rows;
}

/** GET /mobile/me/whole?from=YYYY-MM-DD&to=YYYY-MM-DD (inclusive) → W.H.O.L.E. actions. */
export async function getWhole(session: Session, window: Pick<DateWindow, 'from' | 'to'>): Promise<WholeActivity> {
  const json = await request(`/mobile/me/whole?from=${window.from}&to=${window.to}`, { token: session.access_token });
  logShape('/mobile/me/whole', json);
  return parseWhole(json);
}
