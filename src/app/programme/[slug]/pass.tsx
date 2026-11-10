import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cancelRegistration, getCheckInToken } from '@/api/programmes';
import { refreshDelay, type CheckInToken } from '@/api/programmes-protocol';
import { formatDay, formatTimeRange } from '@/api/today-protocol';
import { useAuth } from '@/auth/AuthProvider';
import { Button } from '@/components/Button';
import { Notice } from '@/components/Notice';
import { AddToCalendarSheet } from '@/components/programme/AddToCalendarSheet';
import { ManageRegistrationSheet } from '@/components/programme/ManageRegistrationSheet';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useProgramme } from '@/hooks/useProgramme';
import { colors, fonts, radius, spacing } from '@/theme';

type CodeState = { token: CheckInToken | null; error: string | null; loadedFor: string | null };

/**
 * Your registration — event pass.
 *   Programme + registration ← GET /mobile/programmes/{slug}
 *   QR check-in code         ← POST /mobile/programmes/{programmeId}/check-in-token (auto-refreshed)
 *   Cancel                   → DELETE /mobile/programmes/{id}/registration
 */
export default function Pass() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { member, withSession } = useAuth();
  const { programme, loading, error, reload } = useProgramme(slug);
  const [code, setCode] = useState<CodeState>({ token: null, error: null, loadedFor: null });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const confirmed = programme?.registration?.status === 'confirmed';
  const programmeId = confirmed ? programme!.id : null;

  // Fetch the check-in code, then refresh it shortly before it expires.
  useEffect(() => {
    if (!programmeId) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = () =>
      withSession((s) => getCheckInToken(s, programmeId)).then(
        (token) => {
          if (!active) return;
          setCode({ token, error: null, loadedFor: programmeId });
          const delay = refreshDelay(token.expiresAt);
          if (delay !== null) timer = setTimeout(load, delay);
        },
        () => active && setCode({ token: null, error: 'Your check-in code will appear closer to the event.', loadedFor: programmeId }),
      );
    void load();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [programmeId, withSession]);

  const onCancel = () =>
    Alert.alert('Cancel registration?', 'You’ll give up your confirmed place.', [
      { text: 'Keep my place', style: 'cancel' },
      {
        text: 'Cancel registration',
        style: 'destructive',
        onPress: async () => {
          if (!programme) return;
          setCancelling(true);
          try {
            await withSession((s) => cancelRegistration(s, programme.id));
            setManageOpen(false);
            router.replace({ pathname: '/programme/[slug]', params: { slug: programme.slug } });
          } catch (e) {
            Alert.alert('Couldn’t cancel', e instanceof Error ? e.message : 'Please try again.');
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);

  if (!programme) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScreenHeader title="Your registration" />
        <View style={styles.center}>
          {loading ? (
            <ActivityIndicator color={colors.primary} accessibilityLabel="Loading your pass" />
          ) : (
            <View style={styles.gap}>
              <Notice message={error ?? 'Your pass could not be loaded.'} />
              <Button variant="secondary" label="Try again" onPress={reload} />
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const status = programme.registration?.status;
  const when = [formatDay(programme.startsAt), formatTimeRange(programme.startsAt, programme.endsAt)].filter(Boolean).join(' · ');
  const showingCode = code.loadedFor === programmeId ? code : { token: null, error: null };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenHeader title="Your registration" />

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.who}>
          {[member?.name, member?.homeParish].filter(Boolean).join(' · ')}
        </Text>

        <View style={styles.card}>
          <Ionicons name="calendar-outline" size={28} color={colors.primary} />
          <Text style={styles.cardTitle} accessibilityRole="header">
            Your event pass
          </Text>
          <Text style={styles.programme}>{programme.title}</Text>

          {status ? (
            <View style={[styles.chip, status !== 'confirmed' && styles.chipPending]}>
              <Ionicons name={status === 'confirmed' ? 'checkmark' : 'time-outline'} size={18} color={status === 'confirmed' ? colors.green : colors.yellow} />
              <Text style={[styles.chipText, status !== 'confirmed' && { color: colors.yellow }]}>
                {status === 'confirmed' ? 'Confirmed' : status === 'waitlisted' ? 'Waitlisted' : 'Pending'}
              </Text>
            </View>
          ) : (
            <Notice message="You’re not registered for this programme." />
          )}

          {when ? (
            <View style={styles.fact}>
              <Ionicons name="time-outline" size={20} color={colors.text} />
              <Text style={styles.factText}>{when}</Text>
            </View>
          ) : null}
          {programme.venue ? (
            <View style={styles.fact}>
              <Ionicons name="location-outline" size={20} color={colors.text} />
              <Text style={styles.factText}>{programme.venue}</Text>
            </View>
          ) : null}

          {confirmed ? (
            <>
              <View style={styles.qrBox} accessible accessibilityLabel="Check-in code">
                {showingCode.token ? (
                  <QRCode value={showingCode.token.token} size={150} backgroundColor="transparent" color={colors.ink} />
                ) : showingCode.error ? (
                  <Text style={styles.qrNote}>{showingCode.error}</Text>
                ) : (
                  <ActivityIndicator color={colors.primary} />
                )}
                <View style={styles.qrLabel}>
                  <View style={[styles.dot, !showingCode.token && { backgroundColor: colors.textSubtle }]} />
                  <Text style={styles.qrLabelText}>Check-in code</Text>
                </View>
              </View>
              <Text style={styles.hint}>Show this code at check-in. Keep this pass open for updates.</Text>
            </>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Add to calendar" onPress={() => setCalendarOpen(true)} disabled={!programme.startsAt} />
        <Button variant="outline" label="Manage registration" onPress={() => setManageOpen(true)} disabled={!status} />
      </View>

      <AddToCalendarSheet programme={programme} visible={calendarOpen} onClose={() => setCalendarOpen(false)} />
      <ManageRegistrationSheet
        title={programme.title}
        visible={manageOpen}
        onClose={() => setManageOpen(false)}
        onViewProgramme={() => {
          setManageOpen(false);
          router.push({ pathname: '/programme/[slug]', params: { slug: programme.slug } });
        }}
        onAddToCalendar={() => {
          setManageOpen(false);
          setCalendarOpen(true);
        }}
        onCancelRegistration={onCancel}
        cancelling={cancelling}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.screen },
  gap: { gap: 12 },
  scroll: { paddingHorizontal: spacing.screen, paddingTop: 12, paddingBottom: 24, gap: 18 },
  who: { fontFamily: fonts.regular, fontSize: 15, color: colors.text },
  card: {
    padding: 20,
    gap: 14,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  cardTitle: { fontFamily: fonts.semibold, fontSize: 22, color: colors.ink },
  programme: { fontFamily: fonts.regular, fontSize: 15, color: colors.text, marginTop: -6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 180,
    borderRadius: radius.pill,
    backgroundColor: colors.greenSoft,
  },
  chipPending: { backgroundColor: colors.yellowSoft },
  chipText: { fontFamily: fonts.medium, fontSize: 15, color: colors.green },
  fact: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  factText: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.text },
  qrBox: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 12,
    padding: 18,
    minWidth: 200,
    minHeight: 200,
    justifyContent: 'center',
    borderRadius: radius.lg,
    backgroundColor: '#EEF0EF',
  },
  qrNote: { fontFamily: fonts.regular, fontSize: 13, color: colors.text, textAlign: 'center', maxWidth: 160 },
  qrLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green },
  qrLabelText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.green },
  hint: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.text },
  footer: { paddingHorizontal: spacing.screen, paddingTop: 8, paddingBottom: 12, gap: 10 },
});
