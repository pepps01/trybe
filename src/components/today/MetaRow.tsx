import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import type { MetaItem } from '@/data/today';
import { fonts } from '@/theme';

const ICONS = { calendar: 'calendar-blank', clock: 'clock-time-four', pin: 'map-marker' } as const;

type Props = { items: MetaItem[]; color: string; size?: number };

/** "📅 Sat 7 Nov  ⏰ 9–11 am" style metadata line. */
export function MetaRow({ items, color, size = 11.5 }: Props) {
  return (
    <View style={styles.row}>
      {items.map((m) => (
        <View key={m.text} style={styles.item}>
          {m.icon ? <MaterialCommunityIcons name={ICONS[m.icon]} size={size + 0.5} color={color} /> : null}
          <Text style={[styles.text, { color, fontSize: size }]} numberOfLines={1}>
            {m.text}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 2 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  text: { fontFamily: fonts.regular },
});
