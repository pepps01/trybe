import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';

import {
  formatDay,
  formatTimeRange,
  reasonLabel,
  totalActions,
  type LeadAction,
  type UpcomingProgramme,
  type WholeActivity,
} from '@/api/today-protocol';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Wing decides the accent tone of the Today feature card. */
export type Wing = 'L360°' | 'G360°';

export type MetaItem = { icon?: 'calendar' | 'clock' | 'pin'; text: string };

export type FeatureCard = {
  kind: 'programme' | 'registration' | 'offline' | 'heart' | 'grow';
  kicker: string;
  title: string;
  meta: MetaItem[];
  cta: string;
  /** Programme/article slug for navigation, when the API gives one. */
  slug?: string | null;
};

export type Plan = {
  id: string;
  /** Programme slug, to open its pass. */
  slug: string | null;
  title: string;
  icon: IconName;
  tone: 'violet' | 'green';
  meta: MetaItem[];
};

export type StartStep = { id: string; title: string; subtitle: string };

export type ExploreItem = {
  id: string;
  title: string;
  subtitle: string;
  icon: IconName;
  /** Colours from the Today design: card, optional border, icon tile, icon. */
  card: string;
  border: string | null;
  tile: string;
  ink: string;
};

/** "Explore your Trybe" — copy, icons and colours as in the Today design. */
export const EXPLORE: ExploreItem[] = [
  {
    id: 'word',
    title: 'Word & Worship',
    subtitle: 'Devotionals, teaching and study',
    icon: 'church-outline',
    card: '#FFFFFF',
    border: '#DEDAF0',
    tile: '#E8E4FB',
    ink: '#5B4BB7',
  },
  {
    id: 'heart',
    title: 'Heart Library',
    subtitle: 'Resources for your heart check.',
    icon: 'hand-heart-outline',
    card: '#FFFFFF',
    border: '#DEDAF0',
    tile: '#DCDEF4',
    ink: '#3A378C',
  },
  {
    id: 'opportunity',
    title: 'Opportunities',
    subtitle: 'Vetted work listings and clinics',
    icon: 'briefcase-outline',
    card: '#FCF8E7',
    border: null,
    tile: '#EDE8CF',
    ink: '#5E5420',
  },
  {
    id: 'learning',
    title: 'Learning',
    subtitle: 'Grow as you take your classes one at a time.',
    icon: 'file-certificate-outline',
    card: '#F3F1FD',
    border: null,
    tile: '#D5ECDB',
    ink: '#1D4B2E',
  },
];

/** Shown on the first visit after onboarding. */
export const START_HERE: StartStep[] = [
  { id: 'circle', title: 'Join a Circle for your season', subtitle: 'Meet people in the same season of life' },
  { id: 'devotion', title: 'Read today’s devotion', subtitle: '5 minutes · Trust in the Lord' },
  { id: 'programme', title: 'Find a programme near you', subtitle: 'Events from your parish and province' },
];

// ---------------------------------------------------------------------------
// API → view mapping
// ---------------------------------------------------------------------------

function whenMeta(startsAt: string | null, endsAt: string | null): MetaItem[] {
  const day = formatDay(startsAt);
  const time = formatTimeRange(startsAt, endsAt);
  return [
    ...(day ? [{ icon: 'calendar' as const, text: day }] : []),
    ...(time ? [{ icon: 'clock' as const, text: time }] : []),
  ];
}

export const OFFLINE_CARD: FeatureCard = {
  kind: 'offline',
  kicker: 'CONNECTION',
  title: 'You’re offline',
  meta: [{ text: 'No connection' }, { text: 'Please reconnect' }],
  cta: 'Try again',
};

/** No recommendation from the API (empty or unavailable). */
export const GROW_CARD: FeatureCard = {
  kind: 'grow',
  kicker: 'YOUR TRYBE',
  title: 'Make room to grow',
  meta: [{ text: 'Faith and community' }, { text: 'At your own pace' }],
  cta: 'Explore Grow',
};

/** GET /mobile/today leadAction → the hero card. */
export function leadToCard(lead: LeadAction | null): FeatureCard {
  if (!lead || lead.status !== 'ok') return GROW_CARD;
  const item = lead.data;
  switch (item.kind) {
    case 'registration':
      return {
        kind: 'registration',
        kicker: 'YOUR REGISTRATION',
        title: item.title,
        meta: whenMeta(item.startsAt, item.endsAt),
        cta: 'View your pass',
        slug: item.slug,
      };
    case 'heart_article':
      return {
        kind: 'heart',
        kicker: 'HEART LIBRARY',
        title: item.title,
        meta: [
          ...(item.readTimeMinutes ? [{ text: `${item.readTimeMinutes} min read` }] : []),
          { text: 'Reviewed guidance' },
        ],
        cta: 'Read article',
        slug: item.slug,
      };
    default:
      return {
        kind: 'programme',
        kicker: reasonLabel(item.reason) || 'FOR YOU',
        title: item.title,
        meta: whenMeta(item.startsAt, item.endsAt),
        cta: 'View the programme',
        slug: item.slug,
      };
  }
}

/** GET /mobile/me/programmes row → "Your next plan" row. */
export function programmeToPlan(p: UpcomingProgramme): Plan {
  const online = p.deliveryMode?.toLowerCase().includes('online') ?? false;
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    icon: online ? 'video-outline' : 'church',
    tone: online ? 'green' : 'violet',
    meta: [...whenMeta(p.startsAt, p.endsAt), ...(p.venue ? [{ icon: 'pin' as const, text: p.venue }] : [])],
  };
}

/** The "W.H.O.L.E. this week" row subtitle. */
export function wholeSummary(week: WholeActivity | null): { activities: number; summary: string } {
  if (!week) return { activities: 0, summary: 'Couldn’t load this week · Tap to retry' };
  const n = totalActions(week);
  if (n === 0) return { activities: 0, summary: 'No activity recorded yet · View week' };
  return { activities: n, summary: `${n} ${n === 1 ? 'activity' : 'activities'} recorded · View week` };
}
