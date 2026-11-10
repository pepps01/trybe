// Integration tests against the real Trybe API (staging by default).
//
//   npm run test:api                         public sign-in contract only
//   TRYBE_TEST_TOKEN=<token> npm run test:api   + signed-in, read-only calls
//
// They call the app's own src/auth/api.ts functions, and every response goes
// through the app's own parsers, so a failure means the app would break too.
// Base URL comes from .env (EXPO_PUBLIC_API_ORIGIN / EXPO_PUBLIC_IDENTITY_ORIGIN).
import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { describe, it } from 'node:test';

import * as programmes from '../../src/api/programmes.ts';
import * as today from '../../src/api/today.ts';
import { weekWindow } from '../../src/api/today-protocol.ts';
import * as api from '../../src/auth/api.ts';
import {
  CALLBACK_URI,
  checkAuthorizationUrl,
  onboardingRequired,
  parseAccountUrl,
} from '../../src/auth/protocol.ts';

const TOKEN = process.env.TRYBE_TEST_TOKEN;
const BOGUS = { access_token: 'not-a-real-token', token_type: 'Bearer', expires_at: '2099-01-01T00:00:00Z' };

/** Same PKCE values the app makes (hex state/verifier, S256 base64url challenge). */
function pkce() {
  const state = randomBytes(32).toString('hex');
  const verifier = randomBytes(32).toString('hex');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  return { state, verifier, challenge };
}

/** Asserts a promise rejects with an ApiError of the given HTTP status. */
async function rejectsWithStatus(promise, status) {
  await assert.rejects(promise, (error) => {
    assert.ok(error instanceof api.ApiError, `expected ApiError, got ${error}`);
    assert.equal(error.status, status);
    return true;
  });
}

describe('configuration', () => {
  it('has an HTTPS API origin from .env', () => {
    assert.match(api.API_ORIGIN ?? '', /^https:\/\//, 'set EXPO_PUBLIC_API_ORIGIN in .env');
  });
});

describe('Trybe Identity (public)', () => {
  it('GET /auth/configuration returns a usable Identity account page', async () => {
    const config = await api.request('/auth/configuration');
    const accountUrl = parseAccountUrl(config);
    assert.match(accountUrl, /^https:\/\//);
    assert.equal(typeof config.identity.driver, 'string');
  });

  it('POST /auth/mobile/start accepts our redirect and returns a safe authorization URL', async () => {
    const { state, challenge } = pkce();
    const raw = await api.startMobileLogin({ codeChallenge: challenge, state, redirectUri: CALLBACK_URI });

    // The same check the app runs before opening the browser.
    const url = new URL(checkAuthorizationUrl(raw, api.IDENTITY_ORIGIN));
    assert.equal(url.searchParams.get('response_type'), 'code');
    assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
    assert.ok(url.searchParams.get('client_id'), 'client_id present');
    // Identity returns to the API, which then forwards to trybe360://auth/callback.
    assert.equal(url.searchParams.get('redirect_uri'), `${api.API_ORIGIN}/api/v1/auth/mobile/callback`);
  });

  it('POST /auth/mobile/start supports prompt=create (Get started)', async () => {
    const { state, challenge } = pkce();
    const raw = await api.startMobileLogin({ codeChallenge: challenge, state, redirectUri: CALLBACK_URI, prompt: 'create' });
    checkAuthorizationUrl(raw, api.IDENTITY_ORIGIN);
  });

  it('the Identity sign-in page is reachable', async () => {
    const { state, challenge } = pkce();
    const raw = await api.startMobileLogin({ codeChallenge: challenge, state, redirectUri: CALLBACK_URI });
    const response = await fetch(raw, { redirect: 'manual' });
    assert.ok(response.status < 400, `Identity answered HTTP ${response.status}`);
  });

  it('POST /auth/mobile/start rejects a redirect that is not allowlisted', async () => {
    const { state, challenge } = pkce();
    await rejectsWithStatus(
      api.startMobileLogin({ codeChallenge: challenge, state, redirectUri: 'evil://auth/callback' }),
      422,
    );
  });

  it('POST /auth/mobile/start rejects a malformed PKCE challenge', async () => {
    const { state } = pkce();
    await rejectsWithStatus(
      api.startMobileLogin({ codeChallenge: 'too-short', state, redirectUri: CALLBACK_URI }),
      422,
    );
  });

  it('POST /auth/mobile/token rejects an invalid one-time code with 401', async () => {
    const { verifier } = pkce();
    await rejectsWithStatus(api.exchangeCode('A'.repeat(64), verifier, 'Trybe360 test'), 401);
  });
});

describe('signed-in calls reject a bad token', () => {
  it('GET /mobile/me → 401', () => rejectsWithStatus(api.getMe(BOGUS), 401));
  it('GET /mobile/me/seasons → 401', () => rejectsWithStatus(api.getSeasons(BOGUS), 401));
  it('POST /auth/mobile/refresh → 401', () => rejectsWithStatus(api.refreshSession(BOGUS), 401));
  it('POST /auth/logout → 401', () => rejectsWithStatus(api.logout(BOGUS), 401));
  it('GET /mobile/today → 401', () => rejectsWithStatus(today.getToday(BOGUS), 401));
  it('GET /mobile/me/programmes → 401', () => rejectsWithStatus(today.getUpcomingProgrammes(BOGUS), 401));
  it('GET /mobile/me/whole → 401', () => rejectsWithStatus(today.getWhole(BOGUS, weekWindow(new Date())), 401));
  it('GET /mobile/programmes/{slug} → 401', () => rejectsWithStatus(programmes.getProgramme(BOGUS, 'any'), 401));
  it('POST /mobile/programmes/{id}/registration → 401', () => rejectsWithStatus(programmes.register(BOGUS, '1'), 401));
  it('DELETE /mobile/programmes/{id}/registration → 401', () => rejectsWithStatus(programmes.cancelRegistration(BOGUS, '1'), 401));
  it('POST /mobile/programmes/{id}/check-in-token → 401', () => rejectsWithStatus(programmes.getCheckInToken(BOGUS, '1'), 401));
});

describe('signed-in calls (read-only)', { skip: !TOKEN && 'set TRYBE_TEST_TOKEN to run' }, () => {
  const session = { access_token: TOKEN, token_type: 'Bearer', expires_at: '2099-01-01T00:00:00Z' };

  it('GET /mobile/me returns a profile the app can read', async () => {
    const member = await api.getMe(session);
    assert.equal(typeof member.id, 'number');
    assert.equal(typeof onboardingRequired(member), 'boolean');
    console.log(
      `  member #${member.id}: name=${member.name ? 'yes' : 'no'}, wing=${member.wing}, ` +
        `parish=${member.homeParish ? 'yes' : 'no'}, onboarding=${member.onboardingState}`,
    );
  });

  it('GET /mobile/me/seasons returns season labels', async () => {
    const seasons = await api.getSeasons(session);
    assert.ok(Array.isArray(seasons));
    for (const label of seasons) assert.equal(typeof label, 'string');
    console.log(`  seasons: ${seasons.join(', ') || '(none)'}`);
  });

  it('GET /mobile/today returns a lead action the hero card can show', async () => {
    const { lead, membershipPhase } = await today.getToday(session);
    assert.ok(['ok', 'empty', 'unavailable'].includes(lead.status));
    // "unavailable" here means the payload didn't match the expected shape — check the [api shape] log.
    console.log(`  membershipPhase: ${membershipPhase}; lead: ${lead.status}${lead.status === 'ok' ? ` (${lead.data.kind})` : ''}`);
  });

  it('GET /mobile/me/programmes?view=upcoming returns plans', async () => {
    const plans = await today.getUpcomingProgrammes(session, 3);
    assert.ok(Array.isArray(plans));
    console.log(`  upcoming plans: ${plans.length}`);
  });

  it('GET /mobile/me/whole returns this week by pillar', async () => {
    const week = await today.getWhole(session, weekWindow(new Date()));
    assert.ok(Array.isArray(week.pillars));
    console.log(`  pillars: ${week.pillars.map((p) => `${p.raw}→${p.key ?? '?'}(${p.actions.length})`).join(', ')}`);
  });
});
