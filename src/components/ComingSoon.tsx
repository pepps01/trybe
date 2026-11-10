import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts, radius, spacing } from '@/theme';

/** Temporary body for tabs that haven't been designed/built yet. */
export function ComingSoon({ title, body, children }: { title: string; body: string; children?: ReactNode }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.card}>
        <Text style={styles.body}>{body}</Text>
      </View>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.screen },
  title: { fontFamily: fonts.semibold, fontSize: 22, color: colors.ink, marginTop: 24 },
  card: { marginTop: 16, padding: 16, borderRadius: radius.lg, backgroundColor: colors.primarySofter },
  body: { fontFamily: fonts.regular, fontSize: 13.5, lineHeight: 20, color: colors.text },
});
