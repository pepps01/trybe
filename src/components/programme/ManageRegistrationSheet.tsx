import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { colors, fonts, radius } from '@/theme';

type Action = { id: string; title: string; subtitle: string; onPress: () => void; destructive?: boolean };

type Props = {
  title: string;
  visible: boolean;
  onClose: () => void;
  onViewProgramme: () => void;
  onAddToCalendar: () => void;
  onCancelRegistration: () => void;
  cancelling?: boolean;
};

/** "Manage registration" sheet: View programme · Add to calendar · Cancel registration. */
export function ManageRegistrationSheet({
  title,
  visible,
  onClose,
  onViewProgramme,
  onAddToCalendar,
  onCancelRegistration,
  cancelling,
}: Props) {
  const actions: Action[] = [
    { id: 'view', title: 'View programme', subtitle: 'Event details and joining information', onPress: onViewProgramme },
    { id: 'calendar', title: 'Add to calendar', subtitle: 'Save the time on your device', onPress: onAddToCalendar },
    {
      id: 'cancel',
      title: cancelling ? 'Cancelling…' : 'Cancel registration',
      subtitle: 'Give up your confirmed place',
      onPress: onCancelRegistration,
      destructive: true,
    },
  ];

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      {actions.map((a) => (
        <Pressable
          key={a.id}
          onPress={a.onPress}
          disabled={cancelling}
          accessibilityRole="button"
          accessibilityLabel={`${a.title}. ${a.subtitle}`}
          style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.primarySofter }]}
        >
          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
          <View style={styles.text}>
            <Text style={[styles.title, a.destructive && styles.destructive]}>{a.title}</Text>
            <Text style={styles.subtitle}>{a.subtitle}</Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color={colors.text} />
        </Pressable>
      ))}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: { flex: 1 },
  title: { fontFamily: fonts.medium, fontSize: 15, color: colors.ink },
  destructive: { color: colors.ink },
  subtitle: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.textMuted, marginTop: 3 },
});
