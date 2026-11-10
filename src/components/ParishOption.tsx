import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius } from '@/theme';

type Parish = { code: string; name: string; location: string };

type Props = {
  parish: Parish;
  selected: boolean;
  onSelect: () => void;
};

/** Selectable parish row (radio style). */
export function ParishOption({ parish, selected, onSelect }: Props) {
  const meta = [parish.location, parish.code].filter(Boolean).join(' · ');
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={[parish.name, parish.location, parish.code && `code ${parish.code}`].filter(Boolean).join(', ')}
      onPress={onSelect}
      style={[styles.card, selected && styles.cardSelected]}
    >
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
      <View style={styles.body}>
        <Text style={styles.name}>{parish.name}</Text>
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cardSelected: {
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySoft,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.textSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.primary, borderWidth: 2 },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  body: { flex: 1 },
  name: { fontFamily: fonts.medium, fontSize: 14.5, color: colors.ink },
  meta: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, marginTop: 3 },
});
