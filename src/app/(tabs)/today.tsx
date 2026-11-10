import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { firstName as getFirstName, formatWing } from '@/auth/protocol';
import { Notice } from '@/components/Notice';
import { FeatureCard } from '@/components/today/FeatureCard';
import {
  EmptyPlans,
  ExploreGrid,
  PlanList,
  SectionTitle,
  StartHere,
  WholeWeekRow,
} from '@/components/today/Sections';
import { TodayHeader } from '@/components/today/TodayHeader';
import { TodaySkeleton } from '@/components/today/TodaySkeleton';
import { WordSection } from '@/components/today/WordSection';
import { WholeWeekSheet } from '@/components/whole/WholeWeekSheet';
import {
  EXPLORE,
  OFFLINE_CARD,
  START_HERE,
  leadToCard,
  programmeToPlan,
  wholeSummary,
} from '@/data/today';
import { useToday } from '@/hooks/useToday';
import { colors, spacing, tones } from '@/theme';

/**
 * Today — the member's home.
 *   Hero card      ← GET /mobile/today (leadAction)
 *   W.H.O.L.E. row ← GET /mobile/me/whole (this Mon–Sun)
 *   Next plan      ← GET /mobile/me/programmes?view=upcoming
 *   Name/parish/wing ← GET /mobile/me (loaded at sign-in)
 */
export default function Today() {
  const { member } = useAuth();
  const { data, loading, refreshing, reload, refresh } = useToday();
  const [weekOpen, setWeekOpen] = useState(false);

  const firstName = getFirstName(member?.name ?? null) ?? 'there';
  const parishName = member?.homeParish ?? 'your parish';
  const tone = formatWing(member?.wing ?? null) === 'G360°' ? tones.violet : tones.pink;

  const card = data?.offline ? OFFLINE_CARD : leadToCard(data?.lead ?? null);
  const whole = wholeSummary(data?.week ?? null);
  // First visit (no confirmed plans or Circle membership) → "Start here" instead of plans.
  const firstVisit = data?.firstVisit ?? false;

  const openProgramme = (slug: string | null | undefined, pass = false) => {
    if (!slug) return router.navigate('/whats-on');
    router.push({ pathname: pass ? '/programme/[slug]/pass' : '/programme/[slug]', params: { slug } });
  };

  const onFeaturePress = () => {
    switch (card.kind) {
      case 'offline':
        return void reload();
      case 'registration':
        return openProgramme(card.slug, true); // "View your pass"
      case 'programme':
        return openProgramme(card.slug); // "View the programme" (unregistered recommendation)
      default:
        return router.navigate('/grow');
    }
  };

  const plans = data?.plans?.map(programmeToPlan) ?? [];

  const onStartStep = (id: string) => {
    if (id === 'circle') router.navigate('/circles');
    else if (id === 'devotion') router.navigate('/grow');
    else router.navigate('/whats-on');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh()}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <TodayHeader
          firstName={firstName}
          parishName={parishName}
          onBellPress={() => Alert.alert('Notifications', 'You’re all caught up.')}
        />

        <View style={styles.content}>
          {loading || !data ? (
            <TodaySkeleton tone={tone} />
          ) : (
            <>
              <FeatureCard card={card} tone={tone} variant={tone === tones.violet ? 'violet' : 'pink'} onPress={onFeaturePress} />

              {data.offline ? null : (
                <>
                  <WholeWeekRow
                    summary={whole.summary}
                    tone={tone}
                    onPress={() => (data.week ? setWeekOpen(true) : void reload())}
                  />

                  {firstVisit ? (
                    <>
                      <SectionTitle>Start here</SectionTitle>
                      <StartHere steps={START_HERE} onPress={onStartStep} />
                    </>
                  ) : data.plans === null ? (
                    <>
                      <SectionTitle>Your plans</SectionTitle>
                      <Notice message="Your plans couldn’t load. Pull down to try again." />
                    </>
                  ) : data.plans.length > 0 ? (
                    <>
                      <SectionTitle>Your next plan</SectionTitle>
                      <PlanList
                        plans={plans}
                        onPress={(id) => openProgramme(plans.find((p) => p.id === id)?.slug, true)}
                      />
                    </>
                  ) : (
                    <>
                      <SectionTitle>Your plans</SectionTitle>
                      <EmptyPlans onPress={() => router.navigate('/whats-on')} />
                    </>
                  )}

                  <SectionTitle>Explore your Trybe</SectionTitle>
                  <ExploreGrid items={EXPLORE} onPress={() => router.navigate('/grow')} />

                  {data.sermons.length > 0 || data.devotional ? (
                    <>
                      <SectionTitle>Make room for the Word</SectionTitle>
                      <WordSection
                        sermons={data.sermons}
                        devotional={data.devotional}
                        onPlay={(s) => (s.mediaUrl ? void WebBrowser.openBrowserAsync(s.mediaUrl) : router.navigate('/grow'))}
                        onOpenDevotional={() => router.navigate('/grow')}
                      />
                    </>
                  ) : null}
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <WholeWeekSheet
        visible={weekOpen}
        onClose={() => setWeekOpen(false)}
        week={data?.week ?? null}
        label={data?.weekWindow.label ?? ''}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: spacing.screen, paddingTop: 12, paddingBottom: 24 },
  content: { marginTop: 18 },
});
