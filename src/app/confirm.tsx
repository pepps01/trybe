import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { firstName, formatWing } from '@/auth/protocol';
import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { Notice } from '@/components/Notice';
import { ProgressHeader } from '@/components/ProgressHeader';
import { colors, fonts, radius, spacing } from '@/theme';

/** Confirm your Trybe — details come from Trybe Identity via GET /mobile/me. */
export default function Confirm() {
  const auth = useAuth();
  const member = auth.member;
  // Pre-ticked if the API already has a confirmation on record.
  const [consented, setConsented] = useState(!!member?.adultConfirmedAt);

  if (!member) return null; // protected route; member loads with the session

  const name = member.name ?? 'Trybe member';
  const first = firstName(member.name);

  const onContinue = async () => {
    // The API keeps the first confirmation, so re-confirming is harmless.
    const updated = member.adultConfirmedAt ? member : await auth.confirmAdult();
    if (updated) router.push('/parish');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <ProgressHeader step={0} showBack={false} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.welcomeCard}>
          <MaterialCommunityIcons name="card-account-details-outline" size={44} color={colors.primary} />
          <Text style={styles.welcomeTitle} accessibilityRole="header">
            {first ? `Welcome, ${first}.` : 'Welcome.'}
          </Text>
          <Text style={styles.welcomeBody}>Your Trybe Identity is connected. Check your details.</Text>
        </View>

        <View style={styles.identityCard}>
          <View style={styles.identityRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.name}>{name}</Text>
              <Text style={styles.source}>{member.maskedEmail ?? 'From Trybe Identity'}</Text>
            </View>
          </View>

          <View style={styles.wingRow}>
            <View style={styles.flex}>
              <Text style={styles.wingLabel}>Your wing</Text>
              <Text style={styles.wingHint}>Your wing comes from your Trybe Identity.</Text>
            </View>
            <View style={styles.wingPill}>
              <Text style={styles.wingPillText}>{formatWing(member.wing) ?? member.wing ?? 'Not set'}</Text>
            </View>
          </View>
        </View>

        <Button
          variant="secondary"
          label="Update Trybe Identity"
          onPress={() => void auth.openIdentityAccount()}
          disabled={auth.busy}
        />

        {auth.error ? <Notice message={auth.error} /> : null}
      </ScrollView>

      <View style={styles.footer}>
        {!consented ? <Text style={styles.helper}>Tick the consent box to continue.</Text> : null}
        <Checkbox
          checked={consented}
          onChange={setConsented}
          label="I consent that I am over 18 years old."
        />
        <Button
          label="Continue"
          arrow="before"
          disabled={!consented}
          loading={auth.busy}
          onPress={() => void onContinue()}
          style={styles.cta}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: { paddingHorizontal: spacing.screen },
  scroll: { paddingHorizontal: spacing.screen, paddingTop: 16, paddingBottom: 24, gap: 12 },
  welcomeCard: {
    backgroundColor: colors.primarySofter,
    borderRadius: radius.xl,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  welcomeTitle: { fontFamily: fonts.bold, fontSize: 21, color: colors.ink, marginTop: 14 },
  welcomeBody: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.text,
    textAlign: 'center',
    marginTop: 8,
  },
  identityCard: { backgroundColor: colors.pinkSoft, borderRadius: radius.xl, padding: 14 },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.medium, fontSize: 13, color: colors.textMuted },
  name: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink },
  source: { fontFamily: fonts.medium, fontSize: 11, color: colors.text, marginTop: 2 },
  wingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 12 },
  wingLabel: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.ink },
  wingHint: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted, marginTop: 2 },
  wingPill: {
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  wingPillText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.primary },
  footer: { paddingHorizontal: spacing.screen, paddingBottom: 12, paddingTop: 8 },
  helper: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 10,
  },
  cta: { marginTop: 10 },
});
