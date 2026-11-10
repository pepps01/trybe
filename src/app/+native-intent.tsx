/**
 * The Trybe Identity redirect (trybe360://auth/callback?code=…) is consumed by
 * WebBrowser.openAuthSessionAsync in AuthProvider. It is not a screen, so stop
 * Expo Router from trying to open it as one: keep the user on Welcome, where
 * sign-in started. AuthProvider then routes onward once the token exchange ends.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  if (path.includes('auth/callback')) return '/welcome';
  return path;
}
