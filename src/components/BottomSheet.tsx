import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, radius } from '@/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  showHandle?: boolean;
  children: ReactNode;
  footer?: ReactNode;
};

export function BottomSheet({ visible, onClose, title, subtitle, showHandle, children, footer }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: 16 + insets.bottom, maxHeight: '88%' }]}>
          {showHandle ? <View style={styles.handle} /> : null}
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title} accessibilityRole="header">
                {title}
              </Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={8}
              style={({ pressed }) => [styles.close, pressed && { opacity: 0.6 }]}
            >
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </Pressable>
          </View>
          <ScrollView bounces={false} contentContainerStyle={styles.body}>
            {children}
          </ScrollView>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.backdrop },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: 12,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  headerText: { flex: 1 },
  title: { fontFamily: fonts.semibold, fontSize: 17, color: colors.ink },
  subtitle: { fontFamily: fonts.regular, fontSize: 11.5, color: colors.textMuted, marginTop: 3 },
  close: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: '#F5F4FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { paddingHorizontal: 16, paddingTop: 16, gap: 10 },
  footer: { paddingHorizontal: 16, paddingTop: 12 },
});
