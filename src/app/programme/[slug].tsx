import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { register } from '@/api/programmes';
import { canRegister, registrationLabel } from '@/api/programmes-protocol';
import { formatDay, formatTimeRange } from '@/api/today-protocol';
import { useAuth } from '@/auth/AuthProvider';
import { Button } from '@/components/Button';
import { Notice } from '@/components/Notice';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useProgramme } from '@/hooks/useProgramme';
import { colors, fonts, radius, spacing } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

/**
 * Programme ← GET /mobile/programmes/{slug}
 * Register  → POST /mobile/programmes/{id}/registration, then the event pass.
 *
 * Not shown until the API provides them: poster image, "people going" and Save.
 */
export default function Programme() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { withSession } = useAuth();
  const { programme, loading, error, reload } = useProgramme(slug);
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [waitlisted, setWaitlisted] = useState<number | null | undefined>(undefined);

  const onRegister = async () => {
    if (!programme) return;
    setRegistering(true);
    setRegisterError(null);
    try {
      const registration = await withSession((s) => register(s, programme.id));
      if (registration?.status === 'waitlisted') {
        setWaitlisted(registration.waitlistPosition);
        reload();
      } else {
        router.push({ pathname: '/programme/[slug]/pass', params: { slug: programme.slug } });
      }
    } catch (e) {
      setRegisterError(e instanceof Error ? e.message : 'Registration could not be completed.');
    } finally {
      setRegistering(false);
    }
  };

  if (!programme) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScreenHeader title="Programme" />
        <View style={styles.center}>
          {loading ? (
            <ActivityIndicator color={colors.primary} accessibilityLabel="Loading programme" />
          ) : (
            <View style={styles.errorBox}>
              <Notice message={error ?? 'This programme could not be loaded.'} />
              <Button variant="secondary" label="Try again" onPress={reload} />
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const registered = programme.registration && programme.registration.status !== 'waitlisted';
  const onWaitlist = programme.registration?.status === 'waitlisted' || waitlisted !== undefined;
  const status = registered ? 'You’re registered' : onWaitlist ? 'You’re on the waitlist' : registrationLabel(programme.registrationStatus);

  const facts = [
    { icon: 'calendar', text: formatDay(programme.startsAt) ?? '' },
    { icon: 'time', text: formatTimeRange(programme.startsAt, programme.endsAt) ?? '' },
    { icon: 'people', text: status ?? '' },
    { icon: 'location', text: programme.venue ?? (programme.deliveryMode?.includes('online') ? 'Online' : '') },
  ].filter((f) => f.text) as { icon: IconName; text: string }[];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenHeader title="Programme" />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <View style={styles.tile}>
            <MaterialCommunityIcons name="calendar-month" size={40} color={colors.white} />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.title} accessibilityRole="header">
              {programme.title}
            </Text>
            {facts.map((f) => (
              <View key={f.icon} style={styles.fact}>
                <Ionicons name={f.icon} size={20} color={colors.primary} />
                <Text style={styles.factText}>{f.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {programme.summary || programme.description ? (
          <View style={styles.card}>
            {programme.summary ? <Text style={styles.cardTitle}>{programme.summary}</Text> : null}
            {programme.description ? <Text style={styles.cardBody}>{programme.description}</Text> : null}
          </View>
        ) : null}

        {programme.ownerName ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Hosted by {programme.ownerName}</Text>
            <Text style={styles.cardBody}>Check your registration here for any changes from the organiser.</Text>
          </View>
        ) : null}

        {onWaitlist ? (
          <Notice
            message={
              waitlisted || programme.registration?.waitlistPosition
                ? `You’re number ${waitlisted ?? programme.registration?.waitlistPosition} on the waitlist. We’ll let you know if a place opens.`
                : 'You’re on the waitlist. We’ll let you know if a place opens.'
            }
          />
        ) : null}
        {registerError ? <Notice message={registerError} /> : null}

        <Text style={styles.footnote}>Registration uses your Trybe profile.</Text>
      </ScrollView>

      <View style={styles.footer}>
        {registered ? (
          <Button
            label="View your pass"
            onPress={() => router.push({ pathname: '/programme/[slug]/pass', params: { slug: programme.slug } })}
          />
        ) : (
          <Button
            label={onWaitlist ? 'On the waitlist' : canRegister(programme) ? 'Register & get pass' : 'Registration closed'}
            loading={registering}
            disabled={onWaitlist || !canRegister(programme)}
            onPress={() => void onRegister()}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.screen },
  errorBox: { gap: 12 },
  scroll: { paddingHorizontal: spacing.screen, paddingTop: 12, paddingBottom: 24, gap: 16 },
  hero: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  // Poster placeholder until the API returns a programme image.
  tile: {
    width: 120,
    height: 156,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: { flex: 1, gap: 10 },
  title: { fontFamily: fonts.semibold, fontSize: 19, lineHeight: 25, color: colors.ink, marginBottom: 2 },
  fact: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  factText: { flex: 1, fontFamily: fonts.regular, fontSize: 14.5, lineHeight: 20, color: colors.primaryDark },
  card: {
    padding: 18,
    gap: 10,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  cardTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink },
  cardBody: { fontFamily: fonts.regular, fontSize: 14.5, lineHeight: 21, color: colors.ink },
  footnote: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink },
  footer: { paddingHorizontal: spacing.screen, paddingTop: 8, paddingBottom: 12 },
});
