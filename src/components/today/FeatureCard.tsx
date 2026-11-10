import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CalendarArt } from '@/components/today/CalendarArt';
import { MetaRow } from '@/components/today/MetaRow';
import type { FeatureCard as FeatureCardData, IconName } from '@/data/today';
import { colors, fonts, radius, type Tone } from '@/theme';

const TILE_ICON: Record<FeatureCardData['kind'], IconName> = {
  programme: 'calendar-month',
  registration: 'calendar-month',
  offline: 'cloud-off-outline',
  heart: 'book-open-page-variant-outline',
  grow: 'file-certificate-outline',
};

type Props = { card: FeatureCardData; tone: Tone; variant: 'pink' | 'violet'; onPress: () => void };

/** The hero card at the top of Today. */
export function FeatureCard({ card, tone, variant, onPress }: Props) {
  const large = card.kind !== 'programme' && card.kind !== 'registration';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${card.kicker}. ${card.title}. ${card.cta}`}
      style={({ pressed }) => [styles.card, { backgroundColor: tone.bg }, pressed && { opacity: 0.92 }]}
    >
      <View style={styles.body}>
        {card.kind === 'programme' || card.kind === 'registration' ? (
          // Calendar illustration from the Today design. Registrations will show the
          // programme poster here once the API returns an image URL.
          <CalendarArt width={70} variant={variant} />
        ) : (
          <LinearGradient colors={[tone.tileFrom, tone.tileTo]} style={styles.tile}>
            <MaterialCommunityIcons name={TILE_ICON[card.kind]} size={34} color={colors.white} />
          </LinearGradient>
        )}
        <View style={styles.text}>
          <Text style={[styles.kicker, { color: tone.kicker }]}>{card.kicker}</Text>
          <Text style={[styles.title, large && styles.titleLarge, { color: tone.title }]}>
            {card.title}
          </Text>
          <MetaRow items={card.meta} color={tone.title} />
        </View>
      </View>

      <View style={[styles.footer, { backgroundColor: tone.footer }]}>
        <Text style={[styles.cta, { color: tone.title }]}>{card.cta}</Text>
        <View style={styles.arrow}>
          <Ionicons name="arrow-forward" size={13} color={colors.white} />
        </View>
      </View>
    </Pressable>
  );
}


const styles = StyleSheet.create({
  card: { borderRadius: radius.xl, overflow: 'hidden' },
  body: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  tile: {
    width: 64,
    height: 66,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
  kicker: { fontFamily: fonts.medium, fontSize: 10, letterSpacing: 0.3 },
  title: { fontFamily: fonts.semibold, fontSize: 15, marginTop: 4, marginBottom: 6 },
  titleLarge: { fontSize: 17, lineHeight: 22 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  cta: { fontFamily: fonts.regular, fontSize: 13 },
  arrow: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
