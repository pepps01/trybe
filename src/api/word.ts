// "Make room for the Word" endpoints. No React Native imports (Node-testable).
import { request } from '../auth/api.ts';
import type { Session } from '../auth/protocol.ts';
import { describeShape } from './today-protocol.ts';
import { mergeMediaDetail, parseDevotional, parseMediaList, type Devotional, type Sermon } from './word-protocol.ts';

const isDev = typeof __DEV__ !== 'undefined' && __DEV__;
const logShape = (label: string, json: unknown) => {
  if (isDev) console.log(`[api shape] ${label}`, JSON.stringify(describeShape(json)));
};

/** GET /word/today */
export async function getDevotional(session: Session): Promise<Devotional | null> {
  let tz: string | null = null;
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    // ignore
  }
  const json = await request(`/word/today${tz ? `?timezone=${encodeURIComponent(tz)}` : ''}`, { token: session.access_token });
  logShape('/word/today', json);
  return parseDevotional(json);
}

/** GET /media?pillar=word_worship, then GET /media/{slug} for the first `limit` (speaker + cover). */
export async function getSermons(session: Session, limit = 3): Promise<Sermon[]> {
  const json = await request('/media?pillar=word_worship', { token: session.access_token });
  logShape('/media', json);
  const rows = parseMediaList(json).slice(0, limit);
  return Promise.all(
    rows.map((row) =>
      request(`/media/${encodeURIComponent(row.slug)}`, { token: session.access_token })
        .then((detail) => mergeMediaDetail(row, detail))
        .catch(() => row),
    ),
  );
}
