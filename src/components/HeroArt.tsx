import { Image } from 'expo-image';
import { StyleSheet, type ImageStyle, type StyleProp } from 'react-native';

import { colors } from '@/theme';

/** Welcome illustration: five young adults talking on a sunlit terrace. */
export function HeroArt({ style }: { style?: StyleProp<ImageStyle> }) {
  return (
    <Image
      source={require('../../assets/images/landing-community.webp')}
      style={[styles.image, style]}
      contentFit="cover"
      accessibilityLabel="Five young adults talking together on a sunlit terrace"
    />
  );
}

const styles = StyleSheet.create({
  image: {
    aspectRatio: 1536 / 1024,
    borderRadius: 20, // as in assets/app/onboard/gathering.svg
    backgroundColor: colors.primarySofter,
  },
});
