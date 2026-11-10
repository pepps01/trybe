/**
 * Pure helpers for the Trybe mobile sign-in protocol and API payloads.
 * No React Native imports, so this file can be unit-tested with plain Node.
 *
 * Sign-in flow (OAuth 2 authorization code + PKCE, brokered by the Trybe API):
 *   1. App makes a random `state` and `verifier`, and sends the SHA-256 challenge
 *      to POST /auth/mobile/start → { authorization_url }.
 *   2. App opens authorization_url (Trybe Identity) in the system browser.
 *   3. Identity redirects to trybe360://auth/callback?state=…&code=… (or &error=…).
 *   4. App checks `state`, then POST /auth/mobile/token { code, code_verifier }
 *      → { access_token, token_type: 'Bearer', expires_at }.
 */

/** Must match `scheme` in app.json and the API's mobile redirect allowlist exactly. */
export const CALLBACK_URI = 'trybe360://auth/callback';

/** Renew the token when it has less than this long left. */
export const REFRESH_WINDOW_MS = 24 * 60 * 60 * 1000;

export type Session = { access_token: string; token_type: 'Bearer'; expires_at: string };

export type ParishLevel = { code: string; level: string; name: string };

export type Member = {
  id: number;
  name: string | null;
  maskedEmail: string | null;
  homeParish: string | null;
  homeParishChurchCode: string | null;
  homeParishChain: ParishLevel[];
  wing: string | null;
  /** The member's life season label, e.g. "Single". */
  community: string | null;
  onboardingState: string;
  seasonOnboardingCompleted: boolean;
  adultConfirmedAt: string | null;
};

// ---------------------------------------------------------------------------
// Payload parsing: reject anything that isn't the shape we rely on.
// ---------------------------------------------------------------------------

export function parseSession(value: unknown): Session {
  const data = value as Partial<Session> | null;
  if (
    !data ||
    typeof data.access_token !== 'string' ||
    data.access_token.length === 0 ||
    data.token_type !== 'Bearer' ||
    typeof data.expires_at !== 'string' ||
    !Number.isFinite(Date.parse(data.expires_at))
  ) {
    throw new Error('The server returned an invalid session. Please sign in again.');
  }
  return { access_token: data.access_token, token_type: 'Bearer', expires_at: data.expires_at };
}

const str = (v: unknown): string | null => (typeof v === 'string' && v.length > 0 ? v : null);

export function parseMember(value: unknown): Member {
  const m = value as Record<string, unknown> | null;
  if (!m || typeof m.id !== 'number') {
    throw new Error('Your profile could not be loaded. Please try again.');
  }
  const chain = Array.isArray(m.homeParishChain)
    ? m.homeParishChain.filter(
        (l): l is ParishLevel =>
          !!l && typeof l === 'object' && typeof (l as ParishLevel).name === 'string',
      )
    : [];
  return {
    id: m.id,
    name: str(m.name),
    maskedEmail: str(m.maskedEmail),
    homeParish: str(m.homeParish),
    homeParishChurchCode: str(m.homeParishChurchCode),
    homeParishChain: chain,
    wing: str(m.wing),
    community: str(m.community),
    onboardingState: typeof m.onboardingState === 'string' ? m.onboardingState : 'unknown',
    seasonOnboardingCompleted: m.seasonOnboardingCompleted !== false,
    adultConfirmedAt: str(m.adultConfirmedAt),
  };
}

/** GET /mobile/me/seasons → season labels, in API order. Accepts strings or { label } objects. */
export function parseSeasons(value: unknown): string[] {
  const data = (value as { data?: unknown } | null)?.data;
  if (!Array.isArray(data)) throw new Error('The seasons could not be loaded. Please try again.');
  return data
    .map((item) =>
      typeof item === 'string' ? item : str((item as { label?: unknown } | null)?.label),
    )
    .filter((label): label is string => !!label);
}

/** GET /auth/configuration → the Trybe Identity account page (HTTPS only). */
export function parseAccountUrl(value: unknown): string {
  const url = (value as { identity?: { accountUrl?: unknown } } | null)?.identity?.accountUrl;
  if (typeof url === 'string') {
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'https:' && !parsed.username && !parsed.password) return parsed.toString();
    } catch {
      // fall through
    }
  }
  throw new Error('Trybe Identity is unavailable right now. Please try again.');
}

// ---------------------------------------------------------------------------
// Sign-in protocol
// ---------------------------------------------------------------------------

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Standard base64 → base64url without padding (RFC 7636 code_challenge format). */
export function base64ToBase64Url(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * The address Identity sends the browser to must be HTTPS, carry no credentials,
 * and (when we know the Identity origin) live on that origin.
 */
export function checkAuthorizationUrl(value: string, identityOrigin: string | null): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('Trybe returned an invalid sign-in address.');
  }
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new Error('Trybe returned an unsafe sign-in address.');
  }
  if (identityOrigin && url.origin !== identityOrigin) {
    throw new Error('Trybe returned an unexpected sign-in address.');
  }
  return url.toString();
}

export function isAuthCallback(value: string): boolean {
  return value === CALLBACK_URI || value.startsWith(`${CALLBACK_URI}?`);
}

/**
 * Reads the one-time code from the Identity redirect after checking it answers
 * *our* request (state match). Throws a user-facing message on any problem.
 */
export function readCallback(value: string, expectedState: string): string {
  if (!isAuthCallback(value)) throw new Error('The sign-in return address is invalid.');
  const query = new URLSearchParams(value.slice(CALLBACK_URI.length + 1));
  if (query.getAll('state').length !== 1 || query.get('state') !== expectedState) {
    throw new Error('The sign-in response did not match your request. Please try again.');
  }
  const error = query.get('error');
  if (error) {
    if (error === 'link_required') {
      throw new Error(
        'Your account needs linking. Complete account recovery in the Trybe web app, then sign in again.',
      );
    }
    throw new Error('Trybe Identity could not complete sign-in. Please try again.');
  }
  const code = query.get('code');
  if (query.getAll('code').length !== 1 || !code || !/^[A-Za-z0-9]{64}$/.test(code)) {
    throw new Error('The sign-in code is missing or invalid. Please try again.');
  }
  return code;
}

// ---------------------------------------------------------------------------
// Session & member helpers
// ---------------------------------------------------------------------------

export function isExpired(session: Session, now = Date.now()): boolean {
  return Date.parse(session.expires_at) <= now;
}

export function needsRefresh(session: Session, now = Date.now()): boolean {
  return Date.parse(session.expires_at) - now < REFRESH_WINDOW_MS;
}

/** Onboarding is needed until Identity details are complete and a season was chosen (or deferred). */
export function onboardingRequired(member: Pick<Member, 'onboardingState' | 'seasonOnboardingCompleted'>): boolean {
  return member.onboardingState !== 'complete' || !member.seasonOnboardingCompleted;
}

export function firstName(name: string | null): string | null {
  return name?.trim().split(/\s+/)[0] || null;
}

/** Normalises the API wing (e.g. "l360", "L360°") to the display form "L360°"; null if unknown. */
export function formatWing(value: string | null): 'L360°' | 'G360°' | null {
  const wing = value?.trim().toLowerCase().replace(/°$/, '');
  return wing === 'l360' ? 'L360°' : wing === 'g360' ? 'G360°' : null;
}

export function hasParish(member: Pick<Member, 'homeParish' | 'homeParishChurchCode'>): boolean {
  return !!member.homeParish || !!member.homeParishChurchCode;
}
