// Unit tests for the sign-in protocol helpers. Run with: npm test
// Node runs the TypeScript source directly (built-in type stripping).
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { describe, it } from 'node:test';

import {
  CALLBACK_URI,
  base64ToBase64Url,
  checkAuthorizationUrl,
  firstName,
  formatWing,
  isAuthCallback,
  isExpired,
  needsRefresh,
  onboardingRequired,
  parseAccountUrl,
  parseMember,
  parseSeasons,
  parseSession,
  readCallback,
  toHex,
} from '../src/auth/protocol.ts';

const STATE = 'a'.repeat(64);
const CODE = 'Ab3'.repeat(21) + 'x'; // 64 alphanumerics
const callback = (query) => `${CALLBACK_URI}?${query}`;

describe('PKCE helpers', () => {
  it('turns standard base64 into the base64url challenge format', () => {
    const verifier = toHex(new Uint8Array(32).map((_, i) => i * 7));
    const base64 = createHash('sha256').update(verifier).digest('base64');
    const expected = createHash('sha256').update(verifier).digest('base64url');
    assert.equal(base64ToBase64Url(base64), expected);
    assert.match(base64ToBase64Url(base64), /^[A-Za-z0-9_-]{43}$/); // API pattern
  });

  it('hex-encodes random bytes into a verifier the API accepts', () => {
    const hex = toHex(new Uint8Array(32).fill(255));
    assert.equal(hex.length, 64);
    assert.match(hex, /^[A-Za-z0-9._~-]{43,128}$/);
  });
});

describe('readCallback', () => {
  it('returns the code when the state matches', () => {
    assert.equal(readCallback(callback(`state=${STATE}&code=${CODE}`), STATE), CODE);
  });

  it('rejects a response for a different sign-in attempt', () => {
    assert.throws(() => readCallback(callback(`state=${'b'.repeat(64)}&code=${CODE}`), STATE), /did not match/);
  });

  it('rejects duplicate state parameters', () => {
    assert.throws(() => readCallback(callback(`state=${STATE}&state=${STATE}&code=${CODE}`), STATE), /did not match/);
  });

  it('explains link_required errors', () => {
    assert.throws(() => readCallback(callback(`state=${STATE}&error=link_required`), STATE), /needs linking/);
  });

  it('reports other Identity errors generically', () => {
    assert.throws(() => readCallback(callback(`state=${STATE}&error=access_denied`), STATE), /could not complete/);
  });

  it('rejects malformed or missing codes', () => {
    assert.throws(() => readCallback(callback(`state=${STATE}&code=short`), STATE), /missing or invalid/);
    assert.throws(() => readCallback(callback(`state=${STATE}`), STATE), /missing or invalid/);
  });

  it('rejects other return addresses', () => {
    assert.equal(isAuthCallback(`evil://auth/callback?state=${STATE}&code=${CODE}`), false);
    assert.throws(() => readCallback(`trybe360://auth/other?state=${STATE}&code=${CODE}`, STATE), /return address/);
  });
});

describe('checkAuthorizationUrl', () => {
  it('accepts HTTPS addresses', () => {
    assert.equal(checkAuthorizationUrl('https://id.example.org/oauth/authorize?x=1', null), 'https://id.example.org/oauth/authorize?x=1');
  });

  it('rejects HTTP and embedded credentials', () => {
    assert.throws(() => checkAuthorizationUrl('http://id.example.org/oauth/authorize', null), /unsafe/);
    assert.throws(() => checkAuthorizationUrl('https://user:pw@id.example.org/', null), /unsafe/);
  });

  it('pins the Identity origin when configured', () => {
    assert.throws(() => checkAuthorizationUrl('https://evil.example.com/oauth/authorize', 'https://id.example.org'), /unexpected/);
  });
});

describe('payload parsing', () => {
  it('accepts a valid session and rejects bad ones', () => {
    const s = { access_token: 'tok', token_type: 'Bearer', expires_at: '2030-01-01T00:00:00Z' };
    assert.deepEqual(parseSession(s), s);
    assert.throws(() => parseSession({ ...s, token_type: 'Basic' }));
    assert.throws(() => parseSession({ ...s, expires_at: 'not a date' }));
    assert.throws(() => parseSession(null));
  });

  it('normalises the member profile', () => {
    const m = parseMember({ id: 7, name: 'Iyanu Ade', wing: 'l360', homeParishChain: [{ code: 'P1', level: 'parish', name: 'Grace' }, null] });
    assert.equal(m.id, 7);
    assert.equal(m.homeParish, null);
    assert.equal(m.homeParishChain.length, 1);
    assert.equal(m.seasonOnboardingCompleted, true);
    assert.throws(() => parseMember({ name: 'No id' }), /could not be loaded/);
  });

  it('reads seasons as strings or { label } objects', () => {
    assert.deepEqual(parseSeasons({ data: ['Single', 'Married'] }), ['Single', 'Married']);
    assert.deepEqual(parseSeasons({ data: [{ slug: 's', label: 'Single', position: 1 }] }), ['Single']);
    assert.throws(() => parseSeasons({}), /could not be loaded/);
  });

  it('only accepts an HTTPS Identity account page', () => {
    assert.equal(parseAccountUrl({ identity: { accountUrl: 'https://id.example.org/account' } }), 'https://id.example.org/account');
    assert.throws(() => parseAccountUrl({ identity: { accountUrl: 'javascript:alert(1)' } }));
  });
});

describe('session & member helpers', () => {
  const now = Date.parse('2026-11-10T12:00:00Z');
  const session = (iso) => ({ access_token: 't', token_type: 'Bearer', expires_at: iso });

  it('detects expiry and the refresh window', () => {
    assert.equal(isExpired(session('2026-11-10T11:59:00Z'), now), true);
    assert.equal(needsRefresh(session('2026-11-10T20:00:00Z'), now), true); // < 24h left
    assert.equal(needsRefresh(session('2026-11-20T00:00:00Z'), now), false);
  });

  it('knows when onboarding is still needed', () => {
    assert.equal(onboardingRequired({ onboardingState: 'complete', seasonOnboardingCompleted: true }), false);
    assert.equal(onboardingRequired({ onboardingState: 'complete', seasonOnboardingCompleted: false }), true);
    assert.equal(onboardingRequired({ onboardingState: 'identity_pending', seasonOnboardingCompleted: true }), true);
  });

  it('formats names and wings for display', () => {
    assert.equal(firstName('  Iyanu  Adebayo '), 'Iyanu');
    assert.equal(firstName(null), null);
    assert.equal(formatWing('l360'), 'L360°');
    assert.equal(formatWing('G360°'), 'G360°');
    assert.equal(formatWing('other'), null);
  });
});
