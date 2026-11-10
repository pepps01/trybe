/**
 * Pure parsers for programme detail, registration and check-in.
 * No React Native imports (tested under Node).
 *
 *   GET    /mobile/programmes/{slug}                     → ProgrammeDetail
 *   POST   /mobile/programmes/{id}/registration          → Registration
 *   DELETE /mobile/programmes/{id}/registration          → Registration
 *   POST   /mobile/programmes/{programmeId}/check-in-token → CheckInToken
 *
 * The spec types several detail fields (registration, isLive, capacity) as plain
 * strings, so those are read defensively.
 */

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown): string | null => (typeof v === 'string' && v.trim().length > 0 ? v : null);
const idOf = (v: unknown): string | null => (typeof v === 'number' ? String(v) : str(v));
const num = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && /^\d+$/.test(v) ? Number(v) : null;
const bool = (v: unknown): boolean => v === true || v === 'true' || v === 1 || v === '1';

export type RegistrationStatus = 'confirmed' | 'waitlisted' | 'pending' | 'cancelled' | 'other';

export function registrationStatus(value: string | null): RegistrationStatus {
  const v = value?.toLowerCase() ?? '';
  if (/confirm|registered|attending|checked/.test(v)) return 'confirmed';
  if (/wait/.test(v)) return 'waitlisted';
  if (/pend|review/.test(v)) return 'pending';
  if (/cancel|withdraw/.test(v)) return 'cancelled';
  return 'other';
}

export type Registration = {
  id: string | null;
  status: RegistrationStatus;
  rawStatus: string | null;
  waitlistPosition: number | null;
};

export type ProgrammeDetail = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  ownerName: string | null;
  startsAt: string | null;
  endsAt: string | null;
  venue: string | null;
  deliveryMode: string | null;
  streamUrl: string | null;
  /** Whether registration is open, e.g. "open", "closed", "full". */
  registrationStatus: string | null;
  isLive: boolean;
  /** The member's own registration, if any (and not cancelled). */
  registration: Registration | null;
};

export function parseRegistration(value: unknown): Registration | null {
  if (!isObj(value)) return null;
  const rawStatus = str(value.status) ?? str(value.effectiveState) ?? str(value.registrationStatus);
  const status = registrationStatus(rawStatus);
  if (status === 'cancelled') return null;
  return {
    id: idOf(value.registrationId) ?? idOf(value.id),
    status,
    rawStatus,
    waitlistPosition: num(value.waitlistPosition),
  };
}

export function parseProgramme(value: unknown): ProgrammeDetail {
  // Some Laravel resources wrap in { data: {...} }.
  const p = isObj(value) && isObj(value.data) && !('title' in value) ? value.data : value;
  if (!isObj(p)) throw new Error('This programme could not be loaded.');
  const id = idOf(p.id);
  const title = str(p.title);
  const slug = str(p.slug);
  if (!id || !title || !slug) throw new Error('This programme could not be loaded.');
  return {
    id,
    slug,
    title,
    summary: str(p.summary),
    description: str(p.description),
    ownerName: str(p.ownerName),
    startsAt: str(p.startsAt),
    endsAt: str(p.endsAt),
    venue: str(p.venue),
    deliveryMode: str(p.deliveryMode),
    streamUrl: str(p.streamUrl),
    registrationStatus: str(p.registrationStatus),
    isLive: bool(p.isLive),
    registration: parseRegistration(p.registration),
  };
}

/** Whether the "Register & get pass" button should be enabled. */
export function canRegister(p: Pick<ProgrammeDetail, 'registrationStatus' | 'registration'>): boolean {
  if (p.registration) return false;
  const s = p.registrationStatus?.toLowerCase() ?? '';
  return !/closed|full|ended|past|cancel|not_open|unavailable/.test(s);
}

/** "open" → "Registration open", "waitlist_open" → "Waitlist open". */
export function registrationLabel(status: string | null): string | null {
  if (!status) return null;
  const words = status.replace(/[_-]+/g, ' ').trim().toLowerCase();
  if (/^(open|closed|full)$/.test(words)) return `Registration ${words}`;
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export type CheckInToken = { token: string; expiresAt: string | null };

export function parseCheckInToken(value: unknown): CheckInToken {
  const t = isObj(value) && isObj(value.data) && !('token' in value) ? value.data : value;
  const token = isObj(t) ? str(t.token) : null;
  if (!token) throw new Error('Your check-in code could not be loaded.');
  return { token, expiresAt: str((t as Obj).expiresAt) };
}

/** Milliseconds until the code should be refreshed (a minute before expiry, at least 15s). */
export function refreshDelay(expiresAt: string | null, now = Date.now()): number | null {
  if (!expiresAt) return null;
  const t = Date.parse(expiresAt);
  if (!Number.isFinite(t)) return null;
  return Math.max(15_000, t - now - 60_000);
}
