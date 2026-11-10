// Design tokens for Trybe360°, sampled from the onboarding designs.

export const colors = {
  primary: '#6C5BD4',
  primaryDark: '#5847C2',
  primarySoft: '#EFEDFB', // secondary buttons, suggestion surfaces
  primarySofter: '#F5F3FD', // welcome card on Confirm
  primaryBorder: '#7C6CDB',

  pinkSoft: '#F8E4F2', // identity card on Confirm

  ink: '#1F1D2B', // headings
  inkHero: '#3A3066', // big welcome headline (from gathering.svg)
  text: '#3E3C4A',
  textMuted: '#6B6977',
  textSubtle: '#8D8B97',

  border: '#DCDAE3',
  borderSoft: '#ECEAF1',
  surface: '#FFFFFF',
  background: '#FFFFFF',
  backdrop: 'rgba(32, 32, 40, 0.45)',

  disabledBg: '#E4E4E7',
  disabledText: '#A1A1AA',

  white: '#FFFFFF',

  // Today
  navy: '#25204A', // arrow chips
  greenSoft: '#E6F4EC',
  green: '#2E7D4F',
  yellowSoft: '#FDF6E1',
  yellow: '#B7821B',
  danger: '#D93025',
  skeleton: '#EEEDF3',
} as const;

/** Accent tones for the Today feature card, keyed by wing. */
export const tones = {
  pink: {
    bg: '#FBE3F5',
    footer: '#F8D6F0',
    tileFrom: '#C35DB1',
    tileTo: '#8E2F80',
    kicker: '#7A4A63',
    title: '#3B1F63',
    accentSoft: colors.greenSoft,
    accent: colors.green,
  },
  violet: {
    bg: '#E9E5FB',
    footer: '#DDD7F8',
    tileFrom: '#6857D6',
    tileTo: '#3D2E9C',
    kicker: '#5A5470',
    title: '#2D2366',
    accentSoft: colors.primarySoft,
    accent: colors.primary,
  },
} as const;

export type Tone = (typeof tones)[keyof typeof tones];

// Logo ring segment colours.
/** Brand ring colours, from the official logo (assets/app/home/brand.svg). */
export const brandRing = ['#835EEE', '#E8C534', '#9278FF', '#FC7F59', '#24D37F'] as const;

export const fonts = {
  regular: 'WorkSans_400Regular',
  medium: 'WorkSans_500Medium',
  semibold: 'WorkSans_600SemiBold',
  bold: 'WorkSans_700Bold',
  extrabold: 'WorkSans_800ExtraBold',
} as const;

export const radius = {
  sm: 8,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
} as const;

export const spacing = {
  screen: 20,
} as const;
