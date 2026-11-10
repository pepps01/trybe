import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Fragment, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { activeDays, bucketCounts, totalActions, type WholeActivity } from '@/api/today-protocol';
import { Button } from '@/components/Button';
import { Notice } from '@/components/Notice';
import { BarChart } from '@/components/whole/BarChart';
import { PILLARS, WEEKDAY_LABELS, type PillarId } from '@/data/whole';
import { useWhole, type Period } from '@/hooks/useWhole';
import { colors, fonts, radius, spacing } from '@/theme';

/** Turns API activity into the numbers, chart buckets and per-pillar lists the screen shows. */
function summarise(activity: WholeActivity | null, period: Period, from: string, days: number) {
  const bucketCount = period === 'week' ? 7 : Math.ceil(days / 7);
  const counts = activity ? bucketCounts(activity, from, bucketCount, period === 'week' ? 1 : 7) : new Array(bucketCount).fill(0);
  const labels = period === 'week' ? WEEKDAY_LABELS : counts.map((_, i) => `W${i + 1}`);
  const byPillar = (id: PillarId) => {
    const rows = activity?.pillars.filter((p) => p.key === id) ?? [];
    const actions = rows.flatMap((p) => p.actions);
    return { count: actions.length, items: actions.map((a) => a.title).filter((t): t is string => !!t) };
  };
  return {
    total: activity ? totalActions(activity) : 0,
    activeDays: activity ? activeDays(activity) : 0,
    buckets: labels.map((label, i) => ({ label, value: counts[i] })),
    byPillar,
  };
}

/** Pillar snapshot · Statistics (Week / Month) ← GET /mobile/me/whole */
export default function WholeStats() {
  const [period, setPeriod] = useState<Period>('week');
  const [offset, setOffset] = useState(0);
  const [reloadToken, setReloadToken] = useState(0);
  const { window, loading, activity, error } = useWhole(period, offset, reloadToken);
  const stats = { label: window.label, ...summarise(activity, period, window.from, window.days) };

  const switchPeriod = (p: Period) => {
    setPeriod(p);
    setOffset(0);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={10}
          style={styles.back}
        >
          <Ionicons name="chevron-back" size={18} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>W.H.O.L.E. statistics</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title} accessibilityRole="header">
          {period === 'week' ? 'Your week, in view' : 'Your month, in view'}
        </Text>

        <View style={styles.segment} accessibilityRole="tablist">
          {(['week', 'month'] as const).map((p) => (
            <Pressable
              key={p}
              onPress={() => switchPeriod(p)}
              accessibilityRole="tab"
              accessibilityState={{ selected: period === p }}
              style={[styles.segmentItem, period === p && styles.segmentActive]}
            >
              <Text style={styles.segmentText}>{p === 'week' ? 'Week' : 'Month'}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.periodNav}>
          <Pressable
            onPress={() => setOffset((o) => o - 1)}
            accessibilityRole="button"
            accessibilityLabel={`Previous ${period}`}
            style={styles.navButton}
          >
            <Ionicons name="chevron-back" size={16} color={colors.textMuted} />
          </Pressable>
          <Text style={styles.periodLabel}>{stats.label}</Text>
          <Pressable
            onPress={() => setOffset((o) => o + 1)}
            disabled={offset >= 0}
            accessibilityRole="button"
            accessibilityLabel={`Next ${period}`}
            accessibilityState={{ disabled: offset >= 0 }}
            style={[styles.navButton, offset >= 0 && { opacity: 0.4 }]}
          >
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loading} accessibilityLabel="Loading activity" />
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Notice message={error} />
            <Button variant="secondary" label="Try again" onPress={() => setReloadToken((n) => n + 1)} />
          </View>
        ) : null}

        <View style={[styles.summary, loading && styles.dimmed]}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNum}>{stats.total}</Text>
            <Text style={styles.summaryLabel}>recorded activities</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNum}>{stats.activeDays}</Text>
            <Text style={styles.summaryLabel}>active days</Text>
          </View>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>
            {period === 'week' ? 'Your week, day by day' : 'Your month, week by week'}
          </Text>
          <View style={styles.chart}>
            <BarChart data={stats.buckets} />
          </View>
          <Text style={styles.caption}>Counts of completed or verified activity</Text>
        </View>

        <Text style={styles.sectionTitle} accessibilityRole="header">
          Across W.H.O.L.E.
        </Text>

        {PILLARS.map((pillar) => {
          if (pillar.private) {
            return (
              <View key={pillar.id} style={[styles.pillarCard, styles.privateCard]}>
                <MaterialCommunityIcons name="lock-outline" size={16} color={colors.primary} />
                <View style={styles.flex}>
                  <Text style={styles.pillarTitle}>{pillar.title}</Text>
                  <Text style={styles.pillarSub}>{pillar.unit}</Text>
                </View>
              </View>
            );
          }
          const activity = stats.byPillar(pillar.id);
          const count = activity.count;
          return (
            <View key={pillar.id} style={styles.pillarCard}>
              <View style={styles.pillarHead}>
                <Ionicons
                  name="checkmark"
                  size={16}
                  color={count > 0 ? colors.primary : colors.textSubtle}
                />
                <View style={styles.flex}>
                  <Text style={styles.pillarTitle}>{pillar.title}</Text>
                  <Text style={styles.pillarSub}>
                    {count} {pillar.unit}
                  </Text>
                </View>
                <Text style={styles.pillarCount}>{count}</Text>
              </View>
              {activity.items.length > 0 ? (
                <View style={styles.items}>
                  {activity.items.map((item, i) => (
                    <Fragment key={`${i}-${item}`}>
                      {i > 0 ? null : <View style={styles.itemsDivider} />}
                      <View style={styles.item}>
                        <Ionicons name="checkmark" size={13} color={colors.textMuted} />
                        <Text style={styles.itemText}>{item}</Text>
                      </View>
                    </Fragment>
                  ))}
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  loading: { marginTop: 16 },
  dimmed: { opacity: 0.5 },
  errorBox: { marginTop: 16, gap: 10 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.screen - 6,
    paddingVertical: 10,
  },
  back: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  scroll: { paddingHorizontal: spacing.screen, paddingTop: 12, paddingBottom: 32 },
  title: { fontFamily: fonts.semibold, fontSize: 20, color: colors.ink },
  segment: {
    flexDirection: 'row',
    marginTop: 18,
    padding: 3,
    borderRadius: radius.md,
    backgroundColor: '#F2F1F7',
  },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: radius.sm },
  segmentActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  segmentText: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.ink },
  periodNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: '#F5F4FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodLabel: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.ink },
  summary: {
    flexDirection: 'row',
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
  },
  summaryItem: { flex: 1, paddingHorizontal: 14 },
  summaryDivider: { width: 1, backgroundColor: '#CFC8F3' },
  summaryNum: { fontFamily: fonts.semibold, fontSize: 24, color: colors.ink },
  summaryLabel: { fontFamily: fonts.regular, fontSize: 11, color: colors.text, marginTop: 6 },
  chartCard: {
    marginTop: 12,
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySofter,
  },
  chartTitle: { fontFamily: fonts.medium, fontSize: 13, color: colors.ink },
  chart: { marginTop: 14 },
  caption: { fontFamily: fonts.regular, fontSize: 10.5, color: colors.textMuted, marginTop: 10 },
  sectionTitle: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.ink,
    marginTop: 24,
    marginBottom: 10,
  },
  pillarCard: {
    padding: 14,
    marginBottom: 10,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySofter,
  },
  privateCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pillarHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pillarTitle: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.ink },
  pillarSub: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted, marginTop: 2 },
  pillarCount: { fontFamily: fonts.semibold, fontSize: 18, color: colors.ink },
  items: { marginTop: 4 },
  itemsDivider: { height: 1, backgroundColor: '#E3DFF6', marginVertical: 8 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5 },
  itemText: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.text },
});
