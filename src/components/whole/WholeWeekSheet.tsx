import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { PillarTile } from '@/components/whole/PillarTile';
import { pillarCount, totalActions, type WholeActivity } from '@/api/today-protocol';
import { PILLARS } from '@/data/whole';
import { colors, fonts, radius } from '@/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** This week's activity from GET /mobile/me/whole. */
  week: WholeActivity | null;
  /** e.g. "2–8 November 2026" */
  label: string;
};

/** W.H.O.L.E. · Returning week · Overlay */
export function WholeWeekSheet({ visible, onClose, week, label }: Props) {
  const total = week ? totalActions(week) : 0;
  const tiles = PILLARS.filter((p) => !p.private);
  const heart = PILLARS.find((p) => p.private)!;

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      showHandle
      title="Your W.H.O.L.E. week"
      subtitle={label.replace(/ \d{4}$/, '')}
      footer={
        <Button
          label="View full statistics"
          onPress={() => {
            onClose();
            router.push('/whole-stats');
          }}
        />
      }
    >
      <View style={styles.total}>
        <View style={styles.flex}>
          <Text style={styles.totalNum}>{total}</Text>
          <Text style={styles.totalLabel}>activities completed or verified</Text>
        </View>
        <View style={styles.trend}>
          <Ionicons name="trending-up" size={16} color={colors.primary} />
        </View>
      </View>

      <View style={styles.grid}>
        {tiles.map((p) => (
          <PillarTile key={p.id} pillar={p} count={week ? pillarCount(week, p.id) : 0} />
        ))}
      </View>

      <View style={styles.heart}>
        <MaterialCommunityIcons name={heart.icon} size={16} color={colors.primary} />
        <View style={styles.flex}>
          <Text style={styles.heartTitle}>{heart.title}</Text>
          <Text style={styles.heartBody}>{heart.unit}</Text>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  total: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
  },
  totalNum: { fontFamily: fonts.semibold, fontSize: 26, color: colors.ink },
  totalLabel: { fontFamily: fonts.regular, fontSize: 12, color: colors.text, marginTop: 6 },
  trend: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#DCD6F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  heart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySofter,
  },
  heartTitle: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.ink },
  heartBody: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted, marginTop: 2 },
});
