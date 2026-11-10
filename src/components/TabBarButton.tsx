import { Ionicons } from '@expo/vector-icons';
import type { TabTriggerSlotProps } from 'expo-router/ui';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius } from '@/theme';

type Props = Omit<TabTriggerSlotProps, 'ref'> & {
  label: string;
  icon?: ComponentProps<typeof Ionicons>['name'];
  /** Optional filled variant shown when the tab is active. */
  focusedIcon?: ComponentProps<typeof Ionicons>['name'];
  /** Custom icon (e.g. avatar) instead of an Ionicon. */
  renderIcon?: () => ReactNode;
  badge?: number;
};

export function TabBarButton({ label, icon, focusedIcon, renderIcon, badge, isFocused, ...props }: Props) {
  const color = isFocused ? colors.primary : colors.textMuted;
  const iconName = isFocused && focusedIcon ? focusedIcon : icon;

  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={badge ? `${label}, ${badge} new` : label}
      style={[styles.button, isFocused && styles.focused]}
    >
      <View>
        {renderIcon ? renderIcon() : iconName ? <Ionicons name={iconName} size={21} color={color} /> : null}
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.label, { color }, isFocused && styles.labelFocused]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 7,
    borderRadius: radius.lg,
  },
  focused: { backgroundColor: colors.primarySoft },
  label: { fontFamily: fonts.regular, fontSize: 11 },
  labelFocused: { fontFamily: fonts.medium },
  badge: {
    position: 'absolute',
    top: -6,
    right: -9,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: fonts.semibold, fontSize: 9.5, color: colors.white },
});
