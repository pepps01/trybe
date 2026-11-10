import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LogoMark } from '@/components/Logo';
import { colors, fonts, radius } from '@/theme';

type Props = {
  firstName: string;
  parishName: string;
  onBellPress: () => void;
  /** Dev-only: long-press the title to cycle through mock states. */
  onTitleLongPress?: () => void;
};

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function TodayHeader({ firstName, parishName, onBellPress, onTitleLongPress }: Props) {
  return (
    <View>
      <View style={styles.topRow}>
        <LogoMark size={30} />
        <Pressable
          onPress={onBellPress}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          style={({ pressed }) => [styles.bell, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="notifications-outline" size={18} color={colors.green} />
        </Pressable>
      </View>

      <Text style={styles.greeting}>
        {greeting()}, {firstName} · {parishName}
      </Text>
      <Text
        style={styles.title}
        accessibilityRole="header"
        onLongPress={onTitleLongPress}
        suppressHighlighting
      >
        Your Trybe today
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bell: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: { fontFamily: fonts.regular, fontSize: 13, color: colors.text, marginTop: 22 },
  title: { fontFamily: fonts.semibold, fontSize: 22, color: colors.ink, marginTop: 4 },
});
