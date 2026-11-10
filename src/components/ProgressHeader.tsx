import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HelpSheet } from '@/components/HelpSheet';
import { colors, fonts, radius } from '@/theme';

const STEPS = ['Your Trybe', 'Parish', 'Season'] as const;

type Props = {
  /** Zero-based index of the current step. */
  step: 0 | 1 | 2;
  showBack?: boolean;
};

export function ProgressHeader({ step, showBack = true }: Props) {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <View style={styles.row}>
      {showBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <Ionicons name="chevron-back" size={16} color={colors.textMuted} />
        </Pressable>
      ) : null}

      <View
        style={styles.steps}
        accessibilityRole="progressbar"
        accessibilityLabel={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`}
      >
        {STEPS.map((label, i) => (
          <View key={label} style={styles.step}>
            <View style={[styles.bar, i <= step && styles.barActive]} />
            <Text style={[styles.stepLabel, i === step && styles.stepLabelActive]}>{label}</Text>
          </View>
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => setHelpOpen(true)}
        style={({ pressed }) => [styles.help, pressed && styles.pressed]}
      >
        <Text style={styles.helpLabel}>Help</Text>
      </Pressable>

      <HelpSheet visible={helpOpen} onClose={() => setHelpOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  back: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: '#F3F3F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  steps: { flex: 1, flexDirection: 'row', gap: 6 },
  step: { flex: 1, alignItems: 'center', gap: 6 },
  bar: { height: 3, alignSelf: 'stretch', borderRadius: 2, backgroundColor: colors.borderSoft },
  barActive: { backgroundColor: colors.primary },
  stepLabel: { fontFamily: fonts.medium, fontSize: 10.5, color: colors.textMuted },
  stepLabelActive: { fontFamily: fonts.semibold, color: colors.primary },
  help: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpLabel: { fontFamily: fonts.semibold, fontSize: 13, color: colors.primary },
  pressed: { opacity: 0.7 },
});
