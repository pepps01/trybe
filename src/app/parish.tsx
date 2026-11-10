import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { hasParish, type Member } from '@/auth/protocol';
import { Button } from '@/components/Button';
import { Notice } from '@/components/Notice';
import { ParishOption } from '@/components/ParishOption';
import { ProgressHeader } from '@/components/ProgressHeader';
import { colors, fonts, radius, spacing } from '@/theme';

/** Where the parish sits, from the levels above it, e.g. "Region 11 · Lagos Province 1". */
function parishLocation(member: Member): string {
  const above = member.homeParishChain
    .filter((l) => l.level !== 'parish' && l.name !== member.homeParish)
    .slice(-2)
    .map((l) => l.name);
  return above.join(' · ');
}

/**
 * Your parish. The home parish is owned by Trybe Identity (the API has no parish
 * search), so the member confirms it here or updates it in Identity.
 */
export default function ConfirmParish() {
  const auth = useAuth();
  const member = auth.member;
  const [selected, setSelected] = useState(false);

  if (!member) return null;

  const known = hasParish(member);
  const parish = {
    code: member.homeParishChurchCode ?? '',
    name: member.homeParish ?? 'Your parish',
    location: parishLocation(member),
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <ProgressHeader step={1} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title} accessibilityRole="header">
          Your parish
        </Text>
        <Text style={styles.body}>
          Your parish comes from Trybe Identity. Check that it’s right before you continue.
        </Text>

        {known ? (
          <View style={styles.card}>
            <Text style={styles.kicker}>FROM YOUR RCCG IDENTITY</Text>
            <View accessibilityRole="radiogroup">
              <ParishOption parish={parish} selected={selected} onSelect={() => setSelected(true)} />
            </View>
            <Text style={styles.check}>Check the location and Church Code before continuing.</Text>
          </View>
        ) : (
          <View style={[styles.card, styles.emptyCard]}>
            <MaterialCommunityIcons name="church" size={22} color={colors.primary} />
            <Text style={styles.emptyTitle}>No parish yet</Text>
            <Text style={styles.check}>
              Set your home parish in Trybe Identity, then come back here — Trybe will pick it up.
            </Text>
          </View>
        )}

        <Button
          variant={known ? 'link' : 'secondary'}
          label={known ? 'Not your parish? Update in Trybe Identity' : 'Set parish in Trybe Identity'}
          onPress={() => void auth.openIdentityAccount()}
          disabled={auth.busy}
          style={styles.update}
        />

        {auth.error ? <Notice message={auth.error} /> : null}
      </ScrollView>

      <View style={styles.footer}>
        {!selected ? (
          <Text style={styles.helper}>
            {known ? 'Select your parish to continue.' : 'Add your parish in Trybe Identity to continue.'}
          </Text>
        ) : null}
        <Button
          label="Continue"
          arrow={selected ? 'before' : undefined}
          disabled={!selected || !known}
          onPress={() => router.push('/season')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.screen },
  scroll: { paddingHorizontal: spacing.screen, paddingTop: 20, paddingBottom: 24 },
  title: { fontFamily: fonts.bold, fontSize: 21, color: colors.ink },
  body: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.text, marginTop: 10 },
  card: {
    marginTop: 20,
    padding: 12,
    gap: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  emptyCard: { alignItems: 'flex-start', backgroundColor: colors.primarySofter, borderWidth: 0, gap: 6 },
  emptyTitle: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  kicker: { fontFamily: fonts.semibold, fontSize: 10, letterSpacing: 0.5, color: colors.primary },
  check: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: colors.text },
  update: { marginTop: 14, marginBottom: 8 },
  footer: { paddingHorizontal: spacing.screen, paddingBottom: 12, paddingTop: 8 },
  helper: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 10,
  },
});
