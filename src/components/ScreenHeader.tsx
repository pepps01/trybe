import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, spacing } from '@/theme';

/** Back button (lavender square) + screen title, as in the Programme / Registration designs. */
export function ScreenHeader({ title }: { title: string }) {
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/today'))}
        accessibilityRole="button"
        accessibilityLabel="Back"
        hitSlop={8}
        style={({ pressed }) => [styles.back, pressed && { opacity: 0.7 }]}
      >
        <Ionicons name="chevron-back" size={18} color={colors.primary} />
      </Pressable>
      <Text style={styles.title} accessibilityRole="header" numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: spacing.screen,
    paddingVertical: 10,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, fontFamily: fonts.semibold, fontSize: 17, color: colors.ink },
});
