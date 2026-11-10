import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius } from '@/theme';

/** Inline error/info message, announced to screen readers. */
export function Notice({ message }: { message: string }) {
  return (
    <View style={styles.box} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: '#FDECEC',
  },
  text: { flex: 1, fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.ink },
});
