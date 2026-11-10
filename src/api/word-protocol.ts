/**
 * Pure parsers for "Make room for the Word" on Today. No React Native imports.
 *
 *   GET /word/today              → today's devotional
 *   GET /media?pillar=word_worship → sermons (list has no speaker/cover…)
 *   GET /media/{slug}            → …so the first few are enriched from detail
 *
 * Note: these are web-API routes (no /mobile prefix); the mobile token works
 * on them if the API accepts Sanctum tokens there.
 */

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown): string | null => (typeof v === 'string' && v.trim().length > 0 ? v : null);
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

export type Devotional = { title: string; scriptureReference: string | null; excerpt: string | null };

/** GET /word/today → { data: { devotional: { title, scriptureReference, body } | null } } */
export function parseDevotional(value: unknown): Devotional | null {
  const data = isObj(value) && isObj(value.data) ? value.data : null;
  const d = data && isObj(data.devotional) ? data.devotional : null;
  const title = d ? str(d.title) : null;
  if (!d || !title) return null;
  const body = str(d.body);
  return { title, scriptureReference: str(d.scriptureReference), excerpt: body ? excerpt(body) : null };
}

/** First sentence-ish of a devotional body, plain text, ≤ 90 chars. */
export function excerpt(body: string, max = 90): string {
  const text = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length <= max ? text : `${text.slice(0, max).replace(/\s+\S*$/, '')}…`;
}

export type Sermon = {
  slug: string;
  title: string;
  speaker: string | null;
  coverImageUrl: string | null;
  durationSeconds: number | null;
  mediaUrl: string | null;
};

/** GET /media → { items: [...] } */
export function parseMediaList(value: unknown): Sermon[] {
  const items = isObj(value) && Array.isArray(value.items) ? value.items : null;
  if (!items) throw new Error('Sermons could not be loaded.');
  return items.filter(isObj).flatMap((m) => {
    const slug = str(m.slug);
    const title = str(m.title);
    if (!slug || !title) return [];
    return [
      {
        slug,
        title,
        speaker: str(m.speaker),
        coverImageUrl: str(m.coverImageUrl),
        durationSeconds: num(m.durationSeconds),
        mediaUrl: str(m.mediaUrl),
      },
    ];
  });
}

/** GET /media/{slug} → { item: {...} } — merges speaker/cover into a list row. */
export function mergeMediaDetail(row: Sermon, value: unknown): Sermon {
  const item = isObj(value) && isObj(value.item) ? value.item : null;
  if (!item) return row;
  return {
    ...row,
    speaker: str(item.speaker) ?? row.speaker,
    coverImageUrl: str(item.coverImageUrl) ?? row.coverImageUrl,
    durationSeconds: num(item.durationSeconds) ?? row.durationSeconds,
    mediaUrl: str(item.mediaUrl) ?? row.mediaUrl,
  };
}

/** 1800 → "30 mins", 3900 → "1 hr 5 mins". */
export function formatDuration(seconds: number | null): string | null {
  if (!seconds || seconds <= 0) return null;
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${Math.max(1, mins)} ${mins === 1 ? 'min' : 'mins'}`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} hr ${m} ${m === 1 ? 'min' : 'mins'}` : `${h} hr`;
}
