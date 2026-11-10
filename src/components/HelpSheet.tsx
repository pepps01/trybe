import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { colors, fonts, radius } from '@/theme';

type Props = { visible: boolean; onClose: () => void };

/** Help with your Trybe · Overlay */
export function HelpSheet({ visible, onClose }: Props) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Help with your Trybe">
      <View style={styles.info}>
        <Text style={styles.infoTitle}>Your parish office</Text>
        <Text style={styles.infoBody}>
          For programme arrangements and local fellowship, speak with your parish office.
        </Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.infoTitle}>Your Trybe Identity</Text>
        <Text style={styles.infoBody}>Your name and wing are managed in Trybe Identity.</Text>
      </View>
      <Pressable
        accessibilityRole="link"
        onPress={() => {
          onClose();
          router.navigate('/grow');
        }}
        style={({ pressed }) => [styles.link, pressed && { backgroundColor: colors.primarySofter }]}
      >
        <Ionicons name="heart-outline" size={20} color={colors.primary} />
        <View style={styles.linkText}>
          <Text style={styles.linkTitle}>Reviewed Heart guidance</Text>
          <Text style={styles.linkBody}>Read privately at your own pace</Text>
        </View>
        <Ionicons name="arrow-forward" size={18} color={colors.textMuted} />
      </Pressable>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  info: { backgroundColor: colors.primarySofter, borderRadius: radius.lg, padding: 16 },
  infoTitle: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  infoBody: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.text, marginTop: 8 },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  linkText: { flex: 1 },
  linkTitle: { fontFamily: fonts.medium, fontSize: 15, color: colors.ink },
  linkBody: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.textMuted, marginTop: 3 },
});
