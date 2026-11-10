import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/theme';

type Props = { data: { label: string; value: number }[]; height?: number };

/** Small count chart: rounded bars, zero values drawn as a flat tick. */
export function BarChart({ data, height = 56 }: Props) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={data.map((d) => `${d.label}: ${d.value}`).join(', ')}
    >
      {data.map((d) => {
        const barHeight = d.value === 0 ? 2 : Math.max(10, (d.value / max) * height);
        return (
          <View key={d.label} style={styles.col}>
            <Text style={styles.value}>{d.value}</Text>
            <View style={[styles.track, { height }]}>
              <View
                style={[
                  styles.bar,
                  d.value === 0 ? styles.zero : styles.filled,
                  { height: barHeight },
                ]}
              />
            </View>
            <Text style={styles.label}>{d.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  col: { alignItems: 'center', flex: 1 },
  value: { fontFamily: fonts.regular, fontSize: 9.5, color: colors.textMuted, marginBottom: 4 },
  track: { justifyContent: 'flex-end' },
  bar: { width: 16 },
  filled: { backgroundColor: colors.primary, borderRadius: 4 },
  zero: { backgroundColor: colors.ink, borderRadius: 1 },
  label: { fontFamily: fonts.regular, fontSize: 10, color: colors.textMuted, marginTop: 6 },
});
