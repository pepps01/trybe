import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Season } from '@/data/onboarding';
import { colors, fonts, radius } from '@/theme';

type Props = {
  season: Season;
  selected: boolean;
  onPress: () => void;
};

export function SeasonCard({ season, selected, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${season.title}. ${season.description}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && !selected && styles.pressed,
      ]}
    >
      <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
        <MaterialCommunityIcons
          name={season.icon}
          size={20}
          color={selected ? colors.white : colors.primary}
        />
      </View>
      <Text style={[styles.title, selected && styles.textSelected]}>{season.title}</Text>
      <Text style={[styles.description, selected && styles.textSelected]} numberOfLines={2}>
        {season.description}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 112,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cardSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  pressed: { backgroundColor: colors.primarySofter },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconWrapSelected: { backgroundColor: colors.primaryDark },
  title: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.ink },
  description: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    lineHeight: 15,
    color: colors.textMuted,
    marginTop: 4,
  },
  textSelected: { color: colors.white },
});
