// Programme endpoints. No React Native imports: runs under Node for tests.
import { request } from '../auth/api.ts';
import type { Session } from '../auth/protocol.ts';
import {
  parseCheckInToken,
  parseProgramme,
  parseRegistration,
  type CheckInToken,
  type ProgrammeDetail,
  type Registration,
} from './programmes-protocol.ts';
import { describeShape } from './today-protocol.ts';

const isDev = typeof __DEV__ !== 'undefined' && __DEV__;
const logShape = (label: string, json: unknown) => {
  if (isDev) console.log(`[api shape] ${label}`, JSON.stringify(describeShape(json)));
};

/** GET /mobile/programmes/{slug} */
export async function getProgramme(session: Session, slug: string): Promise<ProgrammeDetail> {
  const json = await request(`/mobile/programmes/${encodeURIComponent(slug)}`, { token: session.access_token });
  logShape('/mobile/programmes/{slug}', json);
  return parseProgramme(json);
}

/** POST /mobile/programmes/{id}/registration — returns the new registration (may be waitlisted). */
export async function register(session: Session, programmeId: string): Promise<Registration | null> {
  const json = await request(`/mobile/programmes/${encodeURIComponent(programmeId)}/registration`, {
    method: 'POST',
    token: session.access_token,
  });
  logShape('POST /mobile/programmes/{id}/registration', json);
  return parseRegistration(json);
}

/** DELETE /mobile/programmes/{id}/registration */
export async function cancelRegistration(session: Session, programmeId: string): Promise<void> {
  await request(`/mobile/programmes/${encodeURIComponent(programmeId)}/registration`, {
    method: 'DELETE',
    token: session.access_token,
  });
}

/** POST /mobile/programmes/{programmeId}/check-in-token — short-lived code shown as a QR. */
export async function getCheckInToken(session: Session, programmeId: string): Promise<CheckInToken> {
  const json = await request(`/mobile/programmes/${encodeURIComponent(programmeId)}/check-in-token`, {
    method: 'POST',
    token: session.access_token,
  });
  return parseCheckInToken(json);
}
