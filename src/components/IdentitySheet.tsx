import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { colors, fonts } from '@/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
};

/** Bottom sheet shown while handing off to Trybe Identity. */
export function IdentitySheet({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: 16 + insets.bottom }]}>
          <Text style={styles.title} accessibilityRole="header">
            Opening Trybe Identity...
          </Text>
          <Text style={styles.body}>
            Sign in or create your account securely. You’ll return to Trybe when you’re done.
          </Text>
          <Button label="Opening..." loading style={styles.opening} />
          <Button label="Close" variant="link" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.backdrop },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  title: { fontFamily: fonts.bold, fontSize: 19, color: colors.ink },
  body: {
    fontFamily: fonts.regular,
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.text,
    marginTop: 10,
    marginBottom: 14,
  },
  opening: { backgroundColor: colors.primary, opacity: 1 },
});
