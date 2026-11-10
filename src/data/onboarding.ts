import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/** A season card: the label comes from the API, icon/description are presentation. */
export type Season = {
  id: string;
  title: string;
  description: string;
  icon: IconName;
};

// Presentation for the seasons in the design. Matched by keyword so small
// wording differences in the API labels still get the right icon and copy.
const KNOWN: { match: RegExp; description: string; icon: IconName }[] = [
  { match: /widow/i, description: 'After the loss of a spouse', icon: 'hand-heart' },
  { match: /parent/i, description: 'Raising a child on your own', icon: 'human-male-child' },
  { match: /pastor/i, description: 'Serving as a youth pastor, or married to one', icon: 'account-star' },
  { match: /matur/i, description: 'Not married, 31 and over', icon: 'account-check' },
  { match: /married/i, description: 'Married, with or without children', icon: 'heart-multiple' },
  { match: /single/i, description: 'Not married, 18 to 30', icon: 'account' },
];

export function seasonFromLabel(label: string): Season {
  const known = KNOWN.find((k) => k.match.test(label));
  return {
    id: label,
    title: label,
    description: known?.description ?? '',
    icon: known?.icon ?? 'account-outline',
  };
}
