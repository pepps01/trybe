import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { BRAND_FULL_SVG, BRAND_MARK_SVG } from '@/components/brandSvg';

type Props = {
  /** Height in px (the ring mark is square; the full logo is 284:64). */
  size?: number;
};

/** The Trybe360° ring mark (official artwork from assets/app/home/brand.svg). */
export function LogoMark({ size = 40 }: Props) {
  return (
    <View accessibilityRole="image" accessibilityLabel="Trybe360°">
      <SvgXml xml={BRAND_MARK_SVG} width={size} height={size} />
    </View>
  );
}

/** Ring mark + "RCCG NYAYA / Trybe360°" wordmark. */
export function Logo({ size = 40 }: Props) {
  return (
    <View accessibilityRole="image" accessibilityLabel="RCCG NYAYA Trybe360°">
      <SvgXml xml={BRAND_FULL_SVG} width={(size * 284) / 64} height={size} />
    </View>
  );
}
