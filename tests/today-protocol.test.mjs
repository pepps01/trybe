// Unit tests for the Today module's parsers and date helpers. Run with: npm test
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  activeDays,
  bucketCounts,
  formatDay,
  formatTimeRange,
  isConfirmed,
  isFirstVisit,
  monthWindow,
  parseMembershipPhase,
  parseLeadAction,
  parseUpcoming,
  parseWhole,
  pillarCount,
  pillarKey,
  reasonLabel,
  totalActions,
  weekWindow,
} from '../src/api/today-protocol.ts';

// Local-time ISO strings (no Z) so tests don't depend on the machine's timezone.
const at = (y, mo, d, h = 9, mi = 0) => new Date(y, mo - 1, d, h, mi).toISOString();

describe('parseLeadAction (GET /mobile/today)', () => {
  it('reads a programme recommendation', () => {
    const lead = parseLeadAction({
      status: 'ok',
      data: { type: 'programme', reason: 'for_your_province', item: { title: 'Community morning', slug: 'cm', startsAt: at(2026, 11, 7, 9), endsAt: at(2026, 11, 7, 11) } },
    });
    assert.equal(lead.status, 'ok');
    assert.equal(lead.data.kind, 'programme');
    assert.equal(lead.data.title, 'Community morning');
    assert.equal(lead.data.slug, 'cm');
  });

  it('reads a heart article with reading time (either field name)', () => {
    const a = parseLeadAction({ status: 'ok', data: { type: 'heart_article', reason: 'x', item: { title: 'Calm', readTimeMinutes: 5 } } });
    const b = parseLeadAction({ status: 'ok', data: { type: 'heart_article', reason: 'x', item: { title: 'Calm', readingMinutes: 7 } } });
    assert.equal(a.data.readTimeMinutes, 5);
    assert.equal(b.data.readTimeMinutes, 7);
  });

  it('passes through empty, and treats anything odd as unavailable', () => {
    assert.deepEqual(parseLeadAction({ status: 'empty' }), { status: 'empty' });
    assert.deepEqual(parseLeadAction('a string'), { status: 'unavailable' });
    assert.deepEqual(parseLeadAction({ status: 'ok', data: { type: 'podcast', item: { title: 'x' } } }), { status: 'unavailable' });
    assert.deepEqual(parseLeadAction({ status: 'ok', data: { type: 'programme', item: {} } }), { status: 'unavailable' });
  });

  it('turns API reasons into kicker text', () => {
    assert.equal(reasonLabel('for_your_province'), 'FOR YOUR PROVINCE');
    assert.equal(reasonLabel('Near you'), 'NEAR YOU');
  });
});

describe('parseUpcoming (GET /mobile/me/programmes)', () => {
  it('maps registrations and skips rows without a title', () => {
    const rows = parseUpcoming({
      data: [
        { registrationId: 12, programmeId: 'p1', title: 'Midweek Service', startsAt: at(2026, 11, 4), endsAt: null, venue: 'Grace Parish', deliveryMode: 'in_person', effectiveState: 'registered' },
        { registrationId: 13, title: '' },
      ],
    });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].id, '12');
    assert.equal(rows[0].venue, 'Grace Parish');
    assert.equal(rows[0].state, 'registered');
  });

  it('rejects a payload without a data array', () => {
    assert.throws(() => parseUpcoming({}), /could not be loaded/);
  });
});

describe('first visit vs returning member', () => {
  it('reads membershipPhase from the plan section', () => {
    assert.equal(parseMembershipPhase({ status: 'ok', data: { membershipPhase: 'new_member' } }), 'new_member');
    assert.equal(parseMembershipPhase({ status: 'ok', data: null }), null);
  });

  it('shows "Start here" for new members and when there are no confirmed plans', () => {
    assert.equal(isFirstVisit('new_member', 2), true); // API says new, trust it
    assert.equal(isFirstVisit('returning', 0), false); // API says returning
    assert.equal(isFirstVisit(null, 0), true); // unknown phase: no confirmed plans
    assert.equal(isFirstVisit('something_else', 1), false);
  });

  it('only counts confirmed registrations as plans', () => {
    assert.equal(isConfirmed({ state: 'confirmed' }), true);
    assert.equal(isConfirmed({ state: 'registered' }), true);
    assert.equal(isConfirmed({ state: 'waitlisted' }), false);
    assert.equal(isConfirmed({ state: 'cancelled' }), false);
    assert.equal(isConfirmed({ state: null }), false);
  });
});

describe('parseWhole (GET /mobile/me/whole)', () => {
  const payload = {
    from: '2026-11-02',
    to: '2026-11-08',
    pillars: [
      { pillar: 'word_worship', actions: [{ title: 'A daily devotional', completedAt: at(2026, 11, 2) }, { title: 'Make room for the Word', occurredAt: at(2026, 11, 6) }] },
      { pillar: 'opportunity', actions: [{ label: 'Faith Clinic', date: at(2026, 11, 7) }] },
      { pillar: 'learning', actions: ['Step 1', 'Step 2'] }, // undated strings
      { pillar: 'mystery', actions: [{}] },
    ],
  };

  it('maps pillar names to W.H.O.L.E. keys', () => {
    assert.equal(pillarKey('word_worship'), 'word');
    assert.equal(pillarKey('Heart Care'), 'heart');
    assert.equal(pillarKey('ENGAGEMENT'), 'engagement');
    assert.equal(pillarKey('mystery'), null);
  });

  it('reads titles and dates from whichever field the API uses', () => {
    const w = parseWhole(payload);
    assert.equal(totalActions(w), 6);
    assert.equal(pillarCount(w, 'word'), 2);
    assert.equal(pillarCount(w, 'opportunity'), 1);
    assert.equal(w.pillars[1].actions[0].title, 'Faith Clinic');
    assert.equal(w.pillars[2].actions[0].at, null);
  });

  it('counts active days and buckets by day (week) and by 7 days (month)', () => {
    const w = parseWhole(payload);
    assert.equal(activeDays(w), 3);
    assert.deepEqual(bucketCounts(w, '2026-11-02', 7, 1), [1, 0, 0, 0, 1, 1, 0]);
    assert.deepEqual(bucketCounts(w, '2026-11-01', 5, 7), [3, 0, 0, 0, 0]);
  });

  it('rejects a payload without pillars', () => {
    assert.throws(() => parseWhole({ from: 'x' }), /could not be loaded/);
  });
});

describe('date windows & formatting', () => {
  it('builds the Mon–Sun week containing a date', () => {
    const w = weekWindow(new Date(2026, 10, 5)); // Thu 5 Nov 2026
    assert.deepEqual([w.from, w.to, w.label], ['2026-11-02', '2026-11-08', '2–8 November 2026']);
  });

  it('handles weeks that cross a month and Sunday as the last day', () => {
    assert.equal(weekWindow(new Date(2026, 10, 8)).from, '2026-11-02'); // Sunday stays in its week
    assert.equal(weekWindow(new Date(2026, 10, 5), -1).label, '26 October – 1 November 2026');
  });

  it('builds calendar months', () => {
    const m = monthWindow(new Date(2026, 10, 10));
    assert.deepEqual([m.from, m.to, m.days, m.label], ['2026-11-01', '2026-11-30', 30, 'November 2026']);
    assert.equal(monthWindow(new Date(2026, 0, 15), -1).label, 'December 2025');
  });

  it('formats days and time ranges like the design', () => {
    assert.equal(formatDay(at(2026, 11, 7)), 'Sat 7 Nov');
    assert.equal(formatTimeRange(at(2026, 11, 7, 9), at(2026, 11, 7, 11)), '9–11 am');
    assert.equal(formatTimeRange(at(2026, 11, 7, 11), at(2026, 11, 7, 13)), '11 am–1 pm');
    assert.equal(formatTimeRange(at(2026, 11, 7, 9, 30), null), '9:30 am');
    assert.equal(formatDay(null), null);
    assert.equal(formatTimeRange('garbage', null), null);
  });
});
