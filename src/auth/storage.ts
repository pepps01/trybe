import * as SecureStore from 'expo-secure-store';

import { parseSession, type Session } from '@/auth/protocol';

// The access token lives only in the OS keychain/keystore, never in plain storage.
const SESSION_KEY = 'trybe360.session.v1';
const options: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export async function loadSession(): Promise<Session | null> {
  const raw = await SecureStore.getItemAsync(SESSION_KEY, options);
  if (!raw) return null;
  try {
    return parseSession(JSON.parse(raw));
  } catch {
    await SecureStore.deleteItemAsync(SESSION_KEY, options);
    return null;
  }
}

export function saveSession(session: Session): Promise<void> {
  return SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session), options);
}

export function clearSession(): Promise<void> {
  return SecureStore.deleteItemAsync(SESSION_KEY, options);
}
