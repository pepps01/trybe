import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, fonts, radius } from '@/theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'link';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  /** Arrow placement: "after" for "Get started →", "before" for "→ Continue". */
  arrow?: 'before' | 'after';
  style?: StyleProp<ViewStyle>;
  leading?: ReactNode;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  arrow,
  style,
  leading,
}: Props) {
  const isDisabled = disabled || loading;
  const textColor =
    variant === 'primary'
      ? disabled
        ? colors.disabledText
        : colors.white
      : colors.primary;

  const arrowIcon = <Ionicons name="arrow-forward" size={16} color={textColor} />;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'primary' && disabled && styles.primaryDisabled,
        variant === 'secondary' && styles.secondary,
        variant === 'outline' && styles.outline,
        variant === 'link' && styles.link,
        pressed && !isDisabled && (variant === 'link' ? styles.linkPressed : styles.pressed),
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? <ActivityIndicator size="small" color={textColor} /> : leading}
        {arrow === 'before' && !loading ? arrowIcon : null}
        <Text style={[styles.label, variant === 'link' && styles.linkLabel, { color: textColor }]}>
          {label}
        </Text>
        {arrow === 'after' && !loading ? arrowIcon : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primary: { backgroundColor: colors.primary },
  primaryDisabled: { backgroundColor: colors.disabledBg },
  secondary: { backgroundColor: colors.primarySoft, minHeight: 40 },
  outline: { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.surface },
  link: { minHeight: 40, backgroundColor: 'transparent' },
  pressed: { opacity: 0.85 },
  linkPressed: { opacity: 0.6 },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontFamily: fonts.semibold, fontSize: 15 },
  linkLabel: { fontFamily: fonts.medium },
});
