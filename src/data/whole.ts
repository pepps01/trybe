import type { PillarKey } from '@/api/today-protocol';
import type { IconName } from '@/data/today';

/** W.H.O.L.E. = Word & Worship · Heart Care · Opportunity · Learning · Engagement */
export type PillarId = PillarKey;

export type Pillar = {
  id: PillarId;
  title: string;
  unit: string; // e.g. "resources completed"
  icon: IconName;
  tone: 'violet' | 'yellow' | 'green';
  private?: boolean;
};

/** Presentation for each pillar. Activity counts come from GET /mobile/me/whole. */
export const PILLARS: Pillar[] = [
  { id: 'word', title: 'Word & Worship', unit: 'resources completed', icon: 'church', tone: 'violet' },
  { id: 'opportunity', title: 'Opportunity', unit: 'opportunities taken up', icon: 'briefcase-outline', tone: 'yellow' },
  { id: 'learning', title: 'Learning', unit: 'steps completed', icon: 'school-outline', tone: 'violet' },
  { id: 'engagement', title: 'Engagement', unit: 'programmes attended', icon: 'account-group-outline', tone: 'green' },
  { id: 'heart', title: 'Heart Care', unit: 'Your confidential care stays private.', icon: 'lock-outline', tone: 'violet', private: true },
];

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
