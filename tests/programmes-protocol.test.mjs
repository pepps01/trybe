// Unit tests for programme detail / registration / check-in parsing. Run with: npm test
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  canRegister,
  parseCheckInToken,
  parseProgramme,
  parseRegistration,
  refreshDelay,
  registrationLabel,
  registrationStatus,
} from '../src/api/programmes-protocol.ts';

const detail = {
  id: '42',
  slug: 'community-morning',
  title: 'Community morning',
  summary: 'Take part with your parish',
  description: 'A community morning of practical service and fellowship.',
  ownerName: 'Grace Parish',
  startsAt: '2026-11-07T08:00:00Z',
  endsAt: '2026-11-07T10:00:00Z',
  venue: 'Grace Parish · Ikeja, Lagos',
  deliveryMode: 'in_person',
  registrationStatus: 'open',
  isLive: 'false',
  registration: null,
};

describe('parseProgramme (GET /mobile/programmes/{slug})', () => {
  it('reads the fields the Programme screen shows', () => {
    const p = parseProgramme(detail);
    assert.equal(p.id, '42');
    assert.equal(p.ownerName, 'Grace Parish');
    assert.equal(p.isLive, false);
    assert.equal(p.registration, null);
  });

  it('accepts numeric ids and a { data } wrapper', () => {
    assert.equal(parseProgramme({ data: { ...detail, id: 42 } }).id, '42');
  });

  it('rejects payloads without id, slug or title', () => {
    assert.throws(() => parseProgramme({ ...detail, slug: '' }), /could not be loaded/);
  });

  it('reads the member registration and ignores cancelled ones', () => {
    assert.deepEqual(parseProgramme({ ...detail, registration: { registrationId: 7, status: 'confirmed' } }).registration, {
      id: '7', status: 'confirmed', rawStatus: 'confirmed', waitlistPosition: null,
    });
    assert.equal(parseProgramme({ ...detail, registration: { status: 'cancelled' } }).registration, null);
  });
});

describe('registration rules', () => {
  it('maps API statuses to confirmed / waitlisted / pending / cancelled', () => {
    assert.equal(registrationStatus('confirmed'), 'confirmed');
    assert.equal(registrationStatus('registered'), 'confirmed');
    assert.equal(registrationStatus('waitlisted'), 'waitlisted');
    assert.equal(registrationStatus('pending_review'), 'pending');
    assert.equal(registrationStatus('withdrawn'), 'cancelled');
  });

  it('reads POST /registration results including waitlist position', () => {
    assert.deepEqual(parseRegistration({ programmeId: '42', registrationId: '9', status: 'waitlisted', waitlistPosition: '3' }), {
      id: '9', status: 'waitlisted', rawStatus: 'waitlisted', waitlistPosition: 3,
    });
  });

  it('only enables "Register & get pass" when open and not already registered', () => {
    assert.equal(canRegister({ registrationStatus: 'open', registration: null }), true);
    assert.equal(canRegister({ registrationStatus: 'closed', registration: null }), false);
    assert.equal(canRegister({ registrationStatus: 'full', registration: null }), false);
    assert.equal(canRegister({ registrationStatus: 'open', registration: { id: '1', status: 'confirmed', rawStatus: 'confirmed', waitlistPosition: null } }), false);
  });

  it('labels the registration status like the design', () => {
    assert.equal(registrationLabel('open'), 'Registration open');
    assert.equal(registrationLabel('waitlist_open'), 'Waitlist open');
    assert.equal(registrationLabel(null), null);
  });
});

describe('check-in code', () => {
  it('reads the token and expiry', () => {
    assert.deepEqual(parseCheckInToken({ programmeId: '42', token: 'abc', expiresAt: '2026-11-07T08:05:00Z' }), { token: 'abc', expiresAt: '2026-11-07T08:05:00Z' });
    assert.throws(() => parseCheckInToken({ token: '' }), /could not be loaded/);
  });

  it('refreshes a minute before expiry, never more often than every 15s', () => {
    const now = Date.parse('2026-11-07T08:00:00Z');
    assert.equal(refreshDelay('2026-11-07T08:05:00Z', now), 4 * 60_000);
    assert.equal(refreshDelay('2026-11-07T08:00:30Z', now), 15_000);
    assert.equal(refreshDelay(null, now), null);
  });
});
