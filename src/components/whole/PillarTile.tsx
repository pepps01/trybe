import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import type { Pillar } from '@/data/whole';
import { colors, fonts, radius } from '@/theme';

export const PILLAR_TONES = {
  violet: { bg: colors.primarySofter, fg: colors.primary },
  yellow: { bg: colors.yellowSoft, fg: colors.yellow },
  green: { bg: colors.greenSoft, fg: colors.green },
} as const;

/** 2×2 tile in the W.H.O.L.E. week sheet. */
export function PillarTile({ pillar, count }: { pillar: Pillar; count: number }) {
  const tone = PILLAR_TONES[pillar.tone];
  return (
    <View
      style={[styles.tile, { backgroundColor: tone.bg }]}
      accessible
      accessibilityLabel={`${pillar.title}: ${count} ${pillar.unit}`}
    >
      <View style={styles.top}>
        <Text style={styles.count}>{count}</Text>
        <MaterialCommunityIcons name={pillar.icon} size={18} color={tone.fg} />
      </View>
      <Text style={styles.title}>{pillar.title}</Text>
      <Text style={styles.unit}>{pillar.unit}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { flexBasis: '47%', flexGrow: 1, borderRadius: radius.lg, padding: 12, minHeight: 104 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  count: { fontFamily: fonts.semibold, fontSize: 20, color: colors.ink },
  title: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.ink, marginTop: 10 },
  unit: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted, marginTop: 4 },
});
