import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState, Platform } from 'react-native';

import * as api from '@/auth/api';
import {
  CALLBACK_URI,
  base64ToBase64Url,
  checkAuthorizationUrl,
  isExpired,
  needsRefresh,
  readCallback,
  toHex,
  type Member,
  type Session,
} from '@/auth/protocol';
import { clearSession, loadSession, saveSession } from '@/auth/storage';

type Status = 'restoring' | 'signedOut' | 'signedIn';

type AuthValue = {
  status: Status;
  session: Session | null;
  /** Null while loading, or when the profile couldn't be fetched (see `error`). */
  member: Member | null;
  /** True while the "Opening Trybe Identity…" sheet should show. */
  opening: boolean;
  busy: boolean;
  error: string | null;
  clearError: () => void;
  /** Resolves with the member on success, or null if cancelled / failed (see `error`). */
  signIn: (prompt?: 'login' | 'create') => Promise<Member | null>;
  cancelSignIn: () => void;
  signOut: () => Promise<boolean>;
  reloadMember: () => Promise<Member | null>;
  confirmAdult: () => Promise<Member | null>;
  /** Season label, or null to choose later. */
  chooseSeason: (label: string | null) => Promise<Member | null>;
  /** Opens the Trybe Identity account page, then reloads the profile. */
  openIdentityAccount: () => Promise<void>;
  /**
   * Runs a signed-in API call with a fresh token. Signs out on 401/403 and
   * rethrows, so screens can show their own error state. Safe to run in parallel.
   */
  withSession: <T>(call: (session: Session) => Promise<T>) => Promise<T>;
};

const AuthContext = createContext<AuthValue | null>(null);

/** expo-web-browser's Android error when no browser app can open the page. */
function browserError(failure: unknown): Error {
  const message = failure instanceof Error ? failure.message : String(failure);
  if (/No matching browser activity|no.*browser/i.test(message)) {
    return new Error(
      'Signing in needs a web browser. Install or turn on one (for example Chrome, Samsung Internet or Firefox), then try again.',
    );
  }
  return failure instanceof Error ? failure : new Error(message);
}

/** Keep the opening sheet visible briefly before the browser covers the app. */
const SHEET_HOLD_MS = 600;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('restoring');
  const [session, setSession] = useState<Session | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [opening, setOpening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs give async flows the latest values without re-subscribing effects.
  const sessionRef = useRef<Session | null>(null);
  const attempt = useRef(0); // bumps on every sign-in start / cancel
  const locked = useRef(false);

  const signedIn = useCallback(async (value: Session, profile: Member | null) => {
    await saveSession(value);
    sessionRef.current = value;
    setSession(value);
    setMember(profile);
    setStatus('signedIn');
  }, []);

  const signedOut = useCallback(async () => {
    sessionRef.current = null;
    setSession(null);
    setMember(null);
    setStatus('signedOut');
    await clearSession().catch(() => undefined);
  }, []);

  /** Runs one action at a time; maps failures to `error` and 401/403 to sign-out. */
  const run = useCallback(
    async <T,>(action: () => Promise<T>): Promise<T | null> => {
      if (locked.current) return null;
      locked.current = true;
      setBusy(true);
      setError(null);
      try {
        return await action();
      } catch (failure) {
        if (failure instanceof api.ApiError && (failure.status === 401 || failure.status === 403) && sessionRef.current) {
          await signedOut();
        }
        setError(failure instanceof Error ? failure.message : 'Something went wrong. Please try again.');
        return null;
      } finally {
        locked.current = false;
        setBusy(false);
      }
    },
    [signedOut],
  );

  /** Renews the token if it's close to expiry. */
  const freshSession = useCallback(async (): Promise<Session> => {
    let value = sessionRef.current;
    if (!value || isExpired(value)) {
      await signedOut();
      throw new Error('Your session expired. Please sign in again.');
    }
    if (needsRefresh(value)) {
      value = await api.refreshSession(value);
      await saveSession(value);
      sessionRef.current = value;
      setSession(value);
    }
    return value;
  }, [signedOut]);

  // Restore a saved session on launch.
  useEffect(() => {
    let active = true;
    (async () => {
      let readError: unknown = null;
      const saved = await loadSession().catch((e: unknown) => {
        readError = e;
        return null;
      });
      if (!active) return;
      if (!saved || isExpired(saved)) {
        // Dev aid: say why we're signed out (never logs the token itself).
        if (__DEV__) {
          console.log(
            `[auth] restore: ${readError ? `secure storage unreadable (${String(readError)})` : !saved ? 'no saved session' : `session expired at ${saved.expires_at}`}`,
          );
        }
        await signedOut();
        return;
      }
      if (__DEV__) console.log(`[auth] restore: session found, expires ${saved.expires_at}`);
      sessionRef.current = saved;
      setSession(saved);
      setStatus('signedIn');
      await run(async () => {
        const value = await freshSession();
        const profile = await api.getMe(value);
        if (active) setMember(profile);
      });
    })();
    return () => {
      active = false;
    };
  }, [freshSession, run, signedOut]);

  // Coming back to the app: renew the token if needed.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && sessionRef.current && needsRefresh(sessionRef.current)) {
        void run(freshSession);
      }
    });
    return () => sub.remove();
  }, [freshSession, run]);

  const signIn = useCallback(
    (prompt?: 'login' | 'create') =>
      run(async () => {
        const id = ++attempt.current;
        setOpening(true);
        const shownAt = Date.now();
        try {
          // PKCE: random state + verifier; send only the SHA-256 challenge.
          const state = toHex(await Crypto.getRandomBytesAsync(32));
          const verifier = toHex(await Crypto.getRandomBytesAsync(32));
          const challenge = base64ToBase64Url(
            await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, verifier, {
              encoding: Crypto.CryptoEncoding.BASE64,
            }),
          );

          const authorizationUrl = checkAuthorizationUrl(
            await api.startMobileLogin({ codeChallenge: challenge, state, redirectUri: CALLBACK_URI, prompt }),
            api.IDENTITY_ORIGIN,
          );

          await wait(SHEET_HOLD_MS - (Date.now() - shownAt));
          if (id !== attempt.current) return null; // closed while opening

          const result = await WebBrowser.openAuthSessionAsync(authorizationUrl, CALLBACK_URI).catch((e: unknown) => {
            throw browserError(e);
          });
          if (id !== attempt.current || result.type !== 'success') return null;

          const code = readCallback(result.url, state);
          const value = await api.exchangeCode(code, verifier, `Trybe360 ${Platform.OS}`);
          const profile = await api.getMe(value);
          await signedIn(value, profile);
          return profile;
        } finally {
          if (id === attempt.current) setOpening(false);
        }
      }),
    [run, signedIn],
  );

  const cancelSignIn = useCallback(() => {
    attempt.current++;
    setOpening(false);
    try {
      WebBrowser.dismissAuthSession(); // closes the auth browser on iOS
    } catch {
      // Android throws UnavailabilityError (no dismissBrowser there). That's fine:
      // the bumped `attempt` makes signIn ignore whatever the browser returns.
    }
  }, []);

  const signOut = useCallback(async () => {
    const result = await run(async () => {
      const value = sessionRef.current;
      if (value) {
        try {
          await api.logout(value);
        } catch (failure) {
          // An already-invalid token is fine; anything else means we couldn't confirm.
          if (!(failure instanceof api.ApiError && (failure.status === 401 || failure.status === 403))) {
            throw new Error('Sign-out could not be confirmed. Check your connection and try again.');
          }
        }
      }
      await signedOut();
      return true;
    });
    return result === true;
  }, [run, signedOut]);

  const reloadMember = useCallback(
    () =>
      run(async () => {
        const profile = await api.getMe(await freshSession());
        setMember(profile);
        return profile;
      }),
    [freshSession, run],
  );

  const confirmAdult = useCallback(
    () =>
      run(async () => {
        const profile = await api.updateMe(await freshSession(), { adult_confirmed: true });
        setMember(profile);
        return profile;
      }),
    [freshSession, run],
  );

  const chooseSeason = useCallback(
    (label: string | null) =>
      run(async () => {
        const profile = await api.updateMe(await freshSession(), { community: label });
        setMember(profile);
        return profile;
      }),
    [freshSession, run],
  );

  const withSession = useCallback(
    async <T,>(call: (session: Session) => Promise<T>): Promise<T> => {
      try {
        return await call(await freshSession());
      } catch (failure) {
        if (failure instanceof api.ApiError && (failure.status === 401 || failure.status === 403)) {
          await signedOut();
        }
        throw failure;
      }
    },
    [freshSession, signedOut],
  );

  const openIdentityAccount = useCallback(async () => {
    const url = await run(api.getAccountUrl);
    if (!url) return;
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch (e) {
      setError(browserError(e).message);
      return;
    }
    await reloadMember();
  }, [reloadMember, run]);

  const value = useMemo<AuthValue>(
    () => ({
      status,
      session,
      member,
      opening,
      busy,
      error,
      clearError: () => setError(null),
      signIn,
      cancelSignIn,
      signOut,
      reloadMember,
      confirmAdult,
      chooseSeason,
      openIdentityAccount,
      withSession,
    }),
    [status, session, member, opening, busy, error, signIn, cancelSignIn, signOut, reloadMember, confirmAdult, chooseSeason, openIdentityAccount, withSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
