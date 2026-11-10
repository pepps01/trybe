/**
 * Pure parsers + date helpers for the Today module. No React Native imports,
 * so `npm test` can run them under plain Node.
 *
 * Sources:
 *   GET /mobile/today?timezone=…          → leadAction (hero card)
 *   GET /mobile/me/programmes?view=upcoming → "Your next plan"
 *   GET /mobile/me/whole?from=…&to=…       → W.H.O.L.E. activity
 *
 * The spec under-documents /mobile/today and the W.H.O.L.E. action items, so
 * these parsers are defensive: anything unexpected degrades to "unavailable"
 * or is skipped, never crashes the screen.
 */

// ---------------------------------------------------------------------------
// Small readers
// ---------------------------------------------------------------------------

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown): string | null => (typeof v === 'string' && v.trim().length > 0 ? v : null);
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const firstStr = (o: Obj, keys: string[]) => keys.map((k) => str(o[k])).find(Boolean) ?? null;

// ---------------------------------------------------------------------------
// Lead action (Today hero card)
// ---------------------------------------------------------------------------

export type LeadKind = 'programme' | 'registration' | 'heart_article';

export type LeadItem = {
  kind: LeadKind;
  /** Why it's recommended, e.g. "for_your_province" or "For your province". */
  reason: string;
  title: string;
  slug: string | null;
  startsAt: string | null;
  endsAt: string | null;
  readTimeMinutes: number | null;
};

export type LeadAction = { status: 'ok'; data: LeadItem } | { status: 'empty' } | { status: 'unavailable' };

/** Reads `leadAction` from GET /mobile/today: { status, data: { type, reason, item } }. */
export function parseLeadAction(value: unknown): LeadAction {
  if (!isObj(value)) return { status: 'unavailable' };
  if (value.status === 'empty') return { status: 'empty' };
  if (value.status !== 'ok' || !isObj(value.data)) return { status: 'unavailable' };

  const { type, reason, item } = value.data;
  if ((type !== 'programme' && type !== 'registration' && type !== 'heart_article') || !isObj(item)) {
    return { status: 'unavailable' };
  }
  const title = str(item.title);
  if (!title) return { status: 'unavailable' };

  return {
    status: 'ok',
    data: {
      kind: type,
      reason: str(reason) ?? '',
      title,
      slug: str(item.slug),
      startsAt: str(item.startsAt),
      endsAt: str(item.endsAt),
      readTimeMinutes: num(item.readTimeMinutes) ?? num(item.readingMinutes),
    },
  };
}

/** `plan.data.membershipPhase` from GET /mobile/today (values not documented yet). */
export function parseMembershipPhase(plan: unknown): string | null {
  return isObj(plan) && isObj(plan.data) ? str(plan.data.membershipPhase) : null;
}

/**
 * First visit = no confirmed plans and no Circle membership. When the API's
 * membershipPhase is recognisable we trust it; otherwise fall back to "no
 * confirmed plans" (Circle membership has no mobile endpoint yet).
 */
export function isFirstVisit(phase: string | null, confirmedPlans: number): boolean {
  if (phase && /first|new|onboard/i.test(phase)) return true;
  if (phase && /return|active|established|engaged/i.test(phase)) return false;
  return confirmedPlans === 0;
}

/** "for_your_province" → "FOR YOUR PROVINCE" (the card's kicker style). */
export function reasonLabel(reason: string): string {
  return reason.replace(/[_-]+/g, ' ').trim().toUpperCase();
}

// ---------------------------------------------------------------------------
// Upcoming programmes ("Your next plan")
// ---------------------------------------------------------------------------

export type UpcomingProgramme = {
  id: string;
  title: string;
  slug: string | null;
  startsAt: string | null;
  endsAt: string | null;
  venue: string | null;
  deliveryMode: string | null;
  /** e.g. "registered", "waitlisted". */
  state: string | null;
};

/** GET /mobile/me/programmes → { data: MobileMemberProgrammeResource[] }. */
export function parseUpcoming(value: unknown): UpcomingProgramme[] {
  const data = isObj(value) ? value.data : null;
  if (!Array.isArray(data)) throw new Error('Your plans could not be loaded.');
  return data.filter(isObj).flatMap((p) => {
    const title = str(p.title);
    if (!title) return [];
    return [
      {
        id: String(p.registrationId ?? p.programmeId ?? title),
        title,
        slug: str(p.slug),
        startsAt: str(p.startsAt),
        endsAt: str(p.endsAt),
        venue: str(p.venue),
        deliveryMode: str(p.deliveryMode),
        state: str(p.effectiveState) ?? str(p.registrationStatus),
      },
    ];
  });
}

/**
 * "Your next plan" shows confirmed commitments only. Waitlisted, pending or
 * cancelled registrations don't count.
 */
export function isConfirmed(p: Pick<UpcomingProgramme, 'state'>): boolean {
  return !!p.state && /^(confirmed|registered|attending|checked_in)$/i.test(p.state);
}

// ---------------------------------------------------------------------------
// W.H.O.L.E. activity
// ---------------------------------------------------------------------------

export type PillarKey = 'word' | 'heart' | 'opportunity' | 'learning' | 'engagement';

export type WholeAction = { title: string | null; at: string | null };
export type WholePillar = { key: PillarKey | null; raw: string; actions: WholeAction[] };
export type WholeActivity = { from: string; to: string; pillars: WholePillar[] };

/** Maps an API pillar id/label to our five W.H.O.L.E. pillars. */
export function pillarKey(raw: string): PillarKey | null {
  const v = raw.toLowerCase();
  if (/word|worship/.test(v)) return 'word';
  if (/heart|care/.test(v)) return 'heart';
  if (/opportun/.test(v)) return 'opportunity';
  if (/learn/.test(v)) return 'learning';
  if (/engage/.test(v)) return 'engagement';
  return null;
}

const ACTION_TITLE_KEYS = ['title', 'label', 'name', 'summary', 'description'];
const ACTION_DATE_KEYS = ['occurredAt', 'completedAt', 'verifiedAt', 'recordedAt', 'date', 'createdAt', 'at'];

/** GET /mobile/me/whole → { from, to, pillars: [{ pillar, actions: [...] }] }. */
export function parseWhole(value: unknown): WholeActivity {
  if (!isObj(value) || !Array.isArray(value.pillars)) {
    throw new Error('Your W.H.O.L.E. activity could not be loaded.');
  }
  const pillars = value.pillars.filter(isObj).map((row): WholePillar => {
    const raw = str(row.pillar) ?? str(row.key) ?? str(row.label) ?? '';
    const actions = Array.isArray(row.actions)
      ? row.actions.map((a): WholeAction =>
          typeof a === 'string' ? { title: a, at: null } : isObj(a) ? { title: firstStr(a, ACTION_TITLE_KEYS), at: firstStr(a, ACTION_DATE_KEYS) } : { title: null, at: null },
        )
      : [];
    return { key: pillarKey(raw), raw, actions };
  });
  return { from: str(value.from) ?? '', to: str(value.to) ?? '', pillars };
}

export function totalActions(activity: WholeActivity): number {
  return activity.pillars.reduce((n, p) => n + p.actions.length, 0);
}

export function pillarCount(activity: WholeActivity, key: PillarKey): number {
  return activity.pillars.filter((p) => p.key === key).reduce((n, p) => n + p.actions.length, 0);
}

/** Distinct local days (YYYY-MM-DD) with at least one dated action. */
export function activeDays(activity: WholeActivity): number {
  const days = new Set<string>();
  for (const p of activity.pillars) for (const a of p.actions) if (a.at) days.add(isoDate(new Date(a.at)));
  return days.size;
}

/**
 * Counts actions per bucket. Buckets are consecutive [start, end) day ranges
 * starting at `from` (YYYY-MM-DD), `sizeDays` long. Undated actions are skipped.
 */
export function bucketCounts(activity: WholeActivity, from: string, buckets: number, sizeDays: number): number[] {
  const counts = new Array<number>(buckets).fill(0);
  const start = parseIsoDate(from).getTime();
  const day = 24 * 60 * 60 * 1000;
  for (const p of activity.pillars) {
    for (const a of p.actions) {
      if (!a.at) continue;
      const t = new Date(a.at);
      if (Number.isNaN(t.getTime())) continue;
      const local = parseIsoDate(isoDate(t)).getTime(); // local midnight of the action
      const index = Math.floor(Math.round((local - start) / day) / sizeDays);
      if (index >= 0 && index < buckets) counts[index]++;
    }
  }
  return counts;
}

// ---------------------------------------------------------------------------
// Dates (all local time, matching what the member sees)
// ---------------------------------------------------------------------------

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function parseIsoDate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export type DateWindow = { from: string; to: string; days: number; label: string };

/** Mon–Sun week containing `today`, shifted by `offset` weeks. Label: "2–8 November 2026". */
export function weekWindow(today: Date, offset = 0): DateWindow {
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7) + offset * 7);
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
  const sameMonth = monday.getMonth() === sunday.getMonth();
  const label = sameMonth
    ? `${monday.getDate()}–${sunday.getDate()} ${MONTHS[sunday.getMonth()]} ${sunday.getFullYear()}`
    : `${monday.getDate()} ${MONTHS[monday.getMonth()]} – ${sunday.getDate()} ${MONTHS[sunday.getMonth()]} ${sunday.getFullYear()}`;
  return { from: isoDate(monday), to: isoDate(sunday), days: 7, label };
}

/** Calendar month containing `today`, shifted by `offset` months. Label: "November 2026". */
export function monthWindow(today: Date, offset = 0): DateWindow {
  const first = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
  return { from: isoDate(first), to: isoDate(last), days: last.getDate(), label: `${MONTHS[first.getMonth()]} ${first.getFullYear()}` };
}

/** "Sat 7 Nov" — null when missing/unreadable. */
export function formatDay(startsAt: string | null): string | null {
  if (!startsAt) return null;
  const d = new Date(startsAt);
  return Number.isNaN(d.getTime()) ? null : `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

function clock(d: Date): { text: string; period: 'am' | 'pm' } {
  const h = d.getHours() % 12 || 12;
  const m = d.getMinutes();
  return { text: m ? `${h}:${String(m).padStart(2, '0')}` : String(h), period: d.getHours() < 12 ? 'am' : 'pm' };
}

/** "9–11 am", "11 am–1 pm", "9:30 am" — null when missing/unreadable. */
export function formatTimeRange(startsAt: string | null, endsAt: string | null): string | null {
  if (!startsAt) return null;
  const s = new Date(startsAt);
  if (Number.isNaN(s.getTime())) return null;
  const start = clock(s);
  const e = endsAt ? new Date(endsAt) : null;
  if (!e || Number.isNaN(e.getTime())) return `${start.text} ${start.period}`;
  const end = clock(e);
  return start.period === end.period
    ? `${start.text}–${end.text} ${end.period}`
    : `${start.text} ${start.period}–${end.text} ${end.period}`;
}

// ---------------------------------------------------------------------------
// Dev aid: describe a payload's structure without its values.
// ---------------------------------------------------------------------------

export function describeShape(value: unknown, depth = 0): unknown {
  if (depth > 4) return '…';
  if (Array.isArray(value)) return value.length ? [describeShape(value[0], depth + 1), `(${value.length})`] : [];
  if (isObj(value)) return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, describeShape(v, depth + 1)]));
  return value === null ? 'null' : typeof value;
}
