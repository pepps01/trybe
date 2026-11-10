import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Fragment } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MetaRow } from '@/components/today/MetaRow';
import type { ExploreItem, Plan, StartStep } from '@/data/today';
import { colors, fonts, radius, type Tone } from '@/theme';

export function SectionTitle({ children }: { children: string }) {
  return (
    <Text style={styles.sectionTitle} accessibilityRole="header">
      {children}
    </Text>
  );
}

/** "W.H.O.L.E. this week" summary row. */
export function WholeWeekRow({ summary, tone, onPress }: { summary: string; tone: Tone; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.wholeRow, pressed && styles.pressed]}
    >
      <View style={styles.flex}>
        <Text style={styles.rowTitle}>W.H.O.L.E. this week</Text>
        <Text style={styles.rowSub}>{summary}</Text>
      </View>
      <View style={[styles.circle, { backgroundColor: tone.accentSoft }]}>
        <Ionicons name="trending-up" size={16} color={tone.accent} />
      </View>
    </Pressable>
  );
}

/** First-visit numbered checklist. */
export function StartHere({ steps, onPress }: { steps: StartStep[]; onPress: (id: string) => void }) {
  return (
    <View style={styles.listCard}>
      {steps.map((s, i) => (
        <Fragment key={s.id}>
          {i > 0 ? <View style={styles.divider} /> : null}
          <Pressable
            onPress={() => onPress(s.id)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.stepRow, pressed && styles.pressed]}
          >
            <View style={styles.stepNum}>
              <Text style={styles.stepNumText}>{i + 1}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.stepTitle}>{s.title}</Text>
              <Text style={styles.rowSub}>{s.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textSubtle} />
          </Pressable>
        </Fragment>
      ))}
    </View>
  );
}

const PLAN_TONES = {
  violet: { bg: colors.primarySoft, fg: colors.primary },
  green: { bg: colors.greenSoft, fg: colors.green },
};

export function PlanList({ plans, onPress }: { plans: Plan[]; onPress: (id: string) => void }) {
  return (
    <View style={styles.listCard}>
      {plans.map((p, i) => (
        <Fragment key={p.id}>
          {i > 0 ? <View style={styles.divider} /> : null}
          <Pressable
            onPress={() => onPress(p.id)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.planRow, pressed && styles.pressed]}
          >
            <View style={[styles.planIcon, { backgroundColor: PLAN_TONES[p.tone].bg }]}>
              <MaterialCommunityIcons name={p.icon} size={22} color={PLAN_TONES[p.tone].fg} />
            </View>
            <View style={[styles.flex, { gap: 6 }]}>
              <Text style={styles.planTitle}>{p.title}</Text>
              <MetaRow items={p.meta} color={colors.text} />
            </View>
          </Pressable>
        </Fragment>
      ))}
    </View>
  );
}

export function EmptyPlans({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.emptyPlans, pressed && { opacity: 0.85 }]}
    >
      <MaterialCommunityIcons name="chart-bar-stacked" size={30} color={colors.primary} />
      <View style={styles.flex}>
        <Text style={styles.planTitle}>Your plans start here</Text>
        <Text style={[styles.rowSub, { marginTop: 4 }]}>Find a programme in What’s on.</Text>
      </View>
    </Pressable>
  );
}

/** "Explore your Trybe": 2×2 cards with per-pillar colours (see EXPLORE in data/today). */
export function ExploreGrid({ items, onPress }: { items: ExploreItem[]; onPress: (id: string) => void }) {
  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <Pressable
          key={item.id}
          onPress={() => onPress(item.id)}
          accessibilityRole="button"
          accessibilityLabel={`${item.title}. ${item.subtitle}`}
          style={({ pressed }) => [
            styles.exploreCard,
            { backgroundColor: item.card, borderColor: item.border ?? item.card },
            pressed && { opacity: 0.85 },
          ]}
        >
          <View style={[styles.exploreIcon, { backgroundColor: item.tile }]}>
            <MaterialCommunityIcons name={item.icon} size={26} color={item.ink} />
          </View>
          <Text style={styles.exploreTitle}>{item.title}</Text>
          <Text style={styles.exploreSub} numberOfLines={2}>
            {item.subtitle}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { backgroundColor: colors.primarySofter },
  sectionTitle: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.ink,
    marginTop: 24,
    marginBottom: 10,
  },
  wholeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    marginTop: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  rowTitle: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.ink },
  rowSub: { fontFamily: fonts.regular, fontSize: 11.5, color: colors.textMuted, marginTop: 2 },
  circle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  listCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: colors.borderSoft, marginHorizontal: 12 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { fontFamily: fonts.semibold, fontSize: 11, color: colors.primary },
  stepTitle: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.ink },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12 },
  planIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planTitle: { fontFamily: fonts.medium, fontSize: 14.5, color: colors.ink },
  emptyPlans: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 18,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySofter,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  exploreCard: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 136,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  exploreIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  exploreTitle: { fontFamily: fonts.medium, fontSize: 15.5, color: colors.ink },
  exploreSub: { fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 17, color: colors.text, marginTop: 6 },
});
