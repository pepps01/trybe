// No React Native imports here: this module also runs under plain Node for
// the staging API tests (npm run test:api).
import {
  parseAccountUrl,
  parseMember,
  parseSeasons,
  parseSession,
  type Member,
  type Session,
} from './protocol.ts';

// ---------------------------------------------------------------------------
// Configuration (set in .env — see .env.example). EXPO_PUBLIC_* values are
// inlined at build time, so they must be referenced literally like this.
// ---------------------------------------------------------------------------

function origin(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.origin : null;
  } catch {
    return null;
  }
}

export const API_ORIGIN = origin(process.env.EXPO_PUBLIC_API_ORIGIN);
/** Optional: when set, sign-in only opens pages on this origin. */
export const IDENTITY_ORIGIN = origin(process.env.EXPO_PUBLIC_IDENTITY_ORIGIN);

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(
      status === 401
        ? 'Your session expired. Please sign in again.'
        : status === 403
          ? 'An active RCCG Identity is required to use Trybe.'
          : status === 404
            ? 'This isn’t available any more. It may have been moved or removed.'
            : status === 429
            ? 'Too many attempts. Please wait a moment and try again.'
            : status === 503
              ? 'Trybe Identity is unavailable right now. Please try again shortly.'
              : 'Trybe could not complete the request. Please try again.',
    );
    this.name = 'ApiError';
    this.status = status;
  }
}

type RequestOptions = { token?: string; body?: unknown; method?: 'GET' | 'POST' | 'PATCH' | 'DELETE' };

export async function request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!API_ORIGIN) {
    throw new Error('The Trybe API address is not configured (EXPO_PUBLIC_API_ORIGIN).');
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  let response: Response;
  try {
    response = await fetch(`${API_ORIGIN}/api/v1${path}`, {
      method: options.method ?? (options.body === undefined ? 'GET' : 'POST'),
      headers: {
        Accept: 'application/json',
        ...(options.body !== undefined && { 'Content-Type': 'application/json' }),
        ...(options.token && { Authorization: `Bearer ${options.token}` }),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
      credentials: 'omit',
    });
  } catch (cause) {
    // Dev builds only: show the real network error behind the friendly message.
    if (typeof __DEV__ !== 'undefined' && __DEV__) console.warn(`[api] ${path} failed:`, cause);
    throw new Error('Unable to reach Trybe. Check your connection and try again.');
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok) throw new ApiError(response.status);
  return (response.status === 204 ? undefined : await response.json()) as T;
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

export async function startMobileLogin(params: {
  codeChallenge: string;
  state: string;
  redirectUri: string;
  prompt?: 'login' | 'create';
}): Promise<string> {
  const result = await request<{ authorization_url?: unknown }>('/auth/mobile/start', {
    body: {
      redirect_uri: params.redirectUri,
      code_challenge: params.codeChallenge,
      state: params.state,
      ...(params.prompt && { prompt: params.prompt }),
    },
  });
  if (typeof result?.authorization_url !== 'string') {
    throw new Error('Trybe returned an invalid sign-in address.');
  }
  return result.authorization_url;
}

export async function exchangeCode(code: string, codeVerifier: string, deviceName: string): Promise<Session> {
  return parseSession(
    await request('/auth/mobile/token', {
      body: { code, code_verifier: codeVerifier, device_name: deviceName },
    }),
  );
}

export async function refreshSession(session: Session): Promise<Session> {
  return parseSession(await request('/auth/mobile/refresh', { method: 'POST', token: session.access_token }));
}

export async function logout(session: Session): Promise<void> {
  await request('/auth/logout', { method: 'POST', token: session.access_token });
}

export async function getMe(session: Session): Promise<Member> {
  return parseMember(await request('/mobile/me', { token: session.access_token }));
}

/** PATCH /mobile/me. `community` is the season label; null = "choose later". */
export async function updateMe(
  session: Session,
  changes: { adult_confirmed?: true; community?: string | null },
): Promise<Member> {
  return parseMember(
    await request('/mobile/me', { method: 'PATCH', token: session.access_token, body: changes }),
  );
}

export async function getSeasons(session: Session): Promise<string[]> {
  return parseSeasons(await request('/mobile/me/seasons', { token: session.access_token }));
}

export async function getAccountUrl(): Promise<string> {
  return parseAccountUrl(await request('/auth/configuration'));
}
