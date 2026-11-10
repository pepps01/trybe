import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { firstName } from '@/auth/protocol';
import { Button } from '@/components/Button';
import { colors, fonts, radius, spacing } from '@/theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Welcome to your Trybe */
export default function YouBelong() {
  const { member } = useAuth();
  const name = firstName(member?.name ?? null) ?? 'friend';
  const parish = member?.homeParish ? { name: member.homeParish } : null;
  const season = member?.community ?? null;

  // Placeholder content until the programmes/Circles APIs exist.
  const items: { icon: IconName; title: string; meta: string }[] = [
    {
      icon: 'calendar-text-outline',
      title: 'Community morning',
      meta: `Sat 7 Nov · 9–11 am${parish ? ` · ${parish.name}` : ''}`,
    },
    season
      ? { icon: 'account-group-outline', title: '3 Circles for your season', meta: 'Meet people who share your season' }
      : { icon: 'account-group-outline', title: 'Circles near you', meta: 'Meet people in your parish' },
    { icon: 'book-open-variant', title: 'Today’s devotion', meta: '5 minutes · Trust in the Lord' },
  ];

  return (
    <View style={styles.root}>
      <Image
        source={require('../../assets/images/welcome-belonging.webp')}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        contentPosition="top"
        accessibilityLabel="Friends laughing together on sunny steps"
      />
      {/* Light fade so the heading stays readable over the sky. */}
      <LinearGradient
        colors={['rgba(255,250,244,0.85)', 'rgba(255,250,244,0)']}
        style={styles.topScrim}
      />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.heading}>
          <Text style={styles.title} accessibilityRole="header">
            You belong here, {name}.
          </Text>
          <Text style={styles.subtitle}>Your people. Your next chapter.</Text>
        </View>

        <View style={styles.bottom}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Waiting for you</Text>
            {items.map((item) => (
              <View key={item.title} style={styles.item}>
                <View style={styles.itemIcon}>
                  <MaterialCommunityIcons name={item.icon} size={16} color={colors.textMuted} />
                </View>
                <View style={styles.itemText}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemMeta}>{item.meta}</Text>
                </View>
              </View>
            ))}
          </View>

          <Button
            label="Go to Today"
            onPress={() => {
              // Drop the onboarding screens so Android back doesn't return to them.
              if (router.canDismiss()) router.dismissAll();
              router.replace('/today');
            }}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F6EBDD' },
  topScrim: { position: 'absolute', top: 0, left: 0, right: 0, height: 260 },
  safe: { flex: 1, paddingHorizontal: spacing.screen },
  heading: { marginTop: 32 },
  title: { fontFamily: fonts.bold, fontSize: 30, lineHeight: 36, color: colors.ink },
  subtitle: { fontFamily: fonts.regular, fontSize: 14, color: colors.text, marginTop: 10 },
  bottom: { flex: 1, justifyContent: 'flex-end', paddingBottom: 12, gap: 12 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: radius.lg,
    padding: 14,
    gap: 12,
  },
  cardTitle: { fontFamily: fonts.medium, fontSize: 13, color: colors.ink },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: '#F3F3F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: { flex: 1 },
  itemTitle: { fontFamily: fonts.medium, fontSize: 13, color: colors.ink },
  itemMeta: { fontFamily: fonts.regular, fontSize: 11.5, color: colors.textMuted, marginTop: 1 },
});
