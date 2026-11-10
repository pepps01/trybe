import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getSeasons } from '@/auth/api';
import { useAuth } from '@/auth/AuthProvider';
import { onboardingRequired } from '@/auth/protocol';
import { Button } from '@/components/Button';
import { Notice } from '@/components/Notice';
import { ProgressHeader } from '@/components/ProgressHeader';
import { SeasonCard } from '@/components/SeasonCard';
import { seasonFromLabel, type Season } from '@/data/onboarding';
import { colors, fonts, spacing } from '@/theme';

/** What season are you in? (optional) — labels from GET /mobile/me/seasons. */
export default function ChooseSeason() {
  const auth = useAuth();
  const [seasons, setSeasons] = useState<Season[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [season, setSeason] = useState<string | null>(auth.member?.community ?? null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const session = auth.session;
  useEffect(() => {
    if (!session) return;
    let active = true;
    getSeasons(session).then(
      (labels) => active && setSeasons(labels.map(seasonFromLabel)),
      (e: unknown) => active && setLoadError(e instanceof Error ? e.message : 'The seasons could not be loaded.'),
    );
    return () => {
      active = false;
    };
  }, [session, reload]);

  // Saves the season (or null = choose later). The API marks season onboarding done either way.
  const finish = async (label: string | null) => {
    setSaveError(null);
    const updated = await auth.chooseSeason(label);
    if (!updated) return; // auth.error explains why
    if (onboardingRequired(updated)) {
      setSaveError(
        'Your season is saved, but Trybe is still setting up your profile. Try again in a moment, or check your details in Trybe Identity.',
      );
      return;
    }
    router.replace('/you-belong');
  };

  const rows: Season[][] = [];
  for (let i = 0; i < (seasons?.length ?? 0); i += 2) rows.push(seasons!.slice(i, i + 2));

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <ProgressHeader step={2} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title} accessibilityRole="header">
          What season are you in?
        </Text>
        <Text style={styles.body}>
          Optional. We use this to suggest programmes and Circles. It’s never shown on your
          profile, and you can change it anytime in Me.
        </Text>

        {seasons === null && !loadError ? (
          <ActivityIndicator color={colors.primary} style={styles.loading} accessibilityLabel="Loading seasons" />
        ) : null}

        {loadError ? (
          <View style={styles.grid}>
            <Notice message={loadError} />
            <Button
              variant="secondary"
              label="Try again"
              onPress={() => {
                setLoadError(null);
                setReload((n) => n + 1);
              }}
            />
          </View>
        ) : null}

        <View style={styles.grid} accessibilityRole="radiogroup">
          {rows.map((row) => (
            <View key={row[0].id} style={styles.row}>
              {row.map((s) => (
                <SeasonCard
                  key={s.id}
                  season={s}
                  selected={season === s.id}
                  onPress={() => setSeason(season === s.id ? null : s.id)}
                />
              ))}
              {row.length === 1 ? <View style={styles.filler} /> : null}
            </View>
          ))}
        </View>

        {saveError || auth.error ? (
          <View style={styles.grid}>
            <Notice message={(saveError ?? auth.error)!} />
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        {!season ? <Text style={styles.helper}>Choose a season, or choose later.</Text> : null}
        <Button
          label="Continue"
          disabled={!season}
          loading={auth.busy}
          onPress={() => void finish(season)}
        />
        <Button
          variant="link"
          label="Choose later"
          disabled={auth.busy}
          onPress={() => {
            setSeason(null);
            void finish(null);
          }}
          style={styles.later}
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
  body: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.text,
    marginTop: 10,
  },
  grid: { gap: 10, marginTop: 16 },
  row: { flexDirection: 'row', gap: 10 },
  filler: { flex: 1 },
  loading: { marginTop: 32 },
  footer: { paddingHorizontal: spacing.screen, paddingBottom: 4, paddingTop: 8 },
  helper: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 10,
  },
  later: { marginTop: 6 },
});
