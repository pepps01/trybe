// Unit tests for "Make room for the Word" parsing. Run with: npm test
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { excerpt, formatDuration, mergeMediaDetail, parseDevotional, parseMediaList } from '../src/api/word-protocol.ts';

describe('parseDevotional (GET /word/today)', () => {
  it('reads title, scripture and a short plain-text excerpt', () => {
    const d = parseDevotional({
      data: { date: '2026-11-10', devotional: { title: 'Trust in the Lord', scriptureReference: 'Proverbs 3:5', body: '<p>Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him.</p>', topics: [], media: null }, readingPlans: [] },
    });
    assert.equal(d.title, 'Trust in the Lord');
    assert.equal(d.scriptureReference, 'Proverbs 3:5');
    assert.ok(d.excerpt.startsWith('Trust in the Lord with all your heart'));
    assert.ok(d.excerpt.endsWith('…'));
    assert.ok(!d.excerpt.includes('<p>'));
  });

  it('returns null when there is no devotional today', () => {
    assert.equal(parseDevotional({ data: { devotional: null } }), null);
    assert.equal(parseDevotional('nope'), null);
  });

  it('keeps short bodies whole', () => {
    assert.equal(excerpt('Be still.'), 'Be still.');
  });
});

describe('sermons (GET /media + /media/{slug})', () => {
  const list = { items: [{ slug: 'a', type: 'video', title: 'Title of the sermon', durationSeconds: 1800, mediaUrl: 'https://x/a.mp4' }, { slug: '', title: 'skip' }], types: [], pillars: [] };

  it('reads list rows and skips incomplete ones', () => {
    const rows = parseMediaList(list);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].speaker, null);
    assert.throws(() => parseMediaList({}), /could not be loaded/);
  });

  it('fills speaker and cover from the detail endpoint', () => {
    const [row] = parseMediaList(list);
    const merged = mergeMediaDetail(row, { item: { speaker: 'Pastor Leke Adeboye', coverImageUrl: 'https://x/c.jpg' } });
    assert.equal(merged.speaker, 'Pastor Leke Adeboye');
    assert.equal(merged.coverImageUrl, 'https://x/c.jpg');
    assert.equal(mergeMediaDetail(row, null), row);
  });

  it('formats durations like the design', () => {
    assert.equal(formatDuration(1800), '30 mins');
    assert.equal(formatDuration(60), '1 min');
    assert.equal(formatDuration(3900), '1 hr 5 mins');
    assert.equal(formatDuration(null), null);
  });
});
