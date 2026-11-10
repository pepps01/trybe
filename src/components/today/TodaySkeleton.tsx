import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { colors, radius, type Tone } from '@/theme';

/** Today · Loading */
export function TodaySkeleton({ tone }: { tone: Tone }) {
  const [pulse] = useState(() => new Animated.Value(0.55));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.55, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={{ opacity: pulse }}
      accessibilityLabel="Loading your Trybe"
      accessibilityState={{ busy: true }}
    >
      <View style={[styles.feature, { backgroundColor: tone.bg }]}>
        <View style={styles.featureRow}>
          <View style={[styles.tile, { backgroundColor: tone.tileFrom, opacity: 0.4 }]}>
            <MaterialCommunityIcons name="calendar-month" size={30} color={colors.white} />
          </View>
          <View style={[styles.dot, { marginLeft: 8 }]} />
          <View style={[styles.dot, { marginLeft: 40 }]} />
        </View>
        <View style={styles.featureFooter}>
          <View style={[styles.dot, { backgroundColor: colors.border }]} />
        </View>
      </View>

      <View style={styles.whole}>
        <View style={styles.circle} />
      </View>

      <View style={styles.list}>
        {[0, 1].map((i) => (
          <View key={i} style={styles.listRow}>
            <View style={styles.listIcon} />
            <View style={styles.dot} />
            <View style={[styles.dot, { marginLeft: 40 }]} />
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  feature: { borderRadius: radius.xl, padding: 12, height: 150, justifyContent: 'space-between' },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureFooter: { flexDirection: 'row', justifyContent: 'flex-end' },
  tile: { width: 64, height: 66, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.skeleton },
  whole: {
    height: 62,
    marginTop: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  circle: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.skeleton },
  list: { marginTop: 48, gap: 28 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12 },
  listIcon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.skeleton },
});
