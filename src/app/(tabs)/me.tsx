import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Fragment, useState, type ReactNode } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { formatWing } from '@/auth/protocol';
import { Button } from '@/components/Button';
import { HelpSheet } from '@/components/HelpSheet';
import { Logo } from '@/components/Logo';
import { colors, fonts, radius, spacing } from '@/theme';

type Row = { id: string; icon: ReactNode; title: string; subtitle: string; onPress?: () => void };

/** Me · Your Trybe (profile) */
export default function Me() {
  const auth = useAuth();
  const member = auth.member;
  const [helpOpen, setHelpOpen] = useState(false);

  const name = member?.name ?? 'Trybe member';
  const parishName = member?.homeParish ?? 'No parish set';
  const wing = formatWing(member?.wing ?? null) ?? member?.wing ?? null;
  const bio = ''; // GET /mobile/me doesn't return a bio yet
  const seasonLabel = member?.community ?? 'Not set';
  const [signingOut, setSigningOut] = useState(false);

  const signOut = async () => {
    // POST /auth/logout, then clear the stored token. Clearing the session flips
    // the Stack.Protected guard in the root layout → history wiped, Welcome shown.
    setSigningOut(true);
    const ok = await auth.signOut();
    if (!ok) {
      setSigningOut(false);
      Alert.alert('Couldn’t sign out', 'Sign-out could not be confirmed. Check your connection and try again.');
    }
  };

  const confirmSignOut = () =>
    Alert.alert('Sign out of Trybe?', 'You can sign back in anytime with your RCCG Identity.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);

  const makeItYours: Row[] = [
    {
      id: 'season',
      icon: <MaterialCommunityIcons name="hand-heart-outline" size={20} color={colors.primary} />,
      title: 'Season & interests',
      subtitle: seasonLabel,
    },
    {
      id: 'notifications',
      icon: <Ionicons name="notifications-outline" size={20} color={colors.ink} />,
      title: 'Notifications',
      subtitle: 'Categories, channels & quiet hours',
    },
    {
      id: 'privacy',
      icon: <Ionicons name="lock-closed-outline" size={19} color={colors.primary} />,
      title: 'Privacy & data',
      subtitle: 'Your product choices',
    },
  ];

  const account: Row[] = [
    {
      id: 'identity',
      icon: <Ionicons name="person-outline" size={20} color={colors.primary} />,
      title: 'RCCG Identity',
      subtitle: 'Name, email, gender & Home Church',
    },
    {
      id: 'serving',
      icon: <MaterialCommunityIcons name="account-group-outline" size={21} color={colors.primary} />,
      title: 'My serving',
      subtitle: 'Your confirmed commitments',
    },
    {
      id: 'help',
      icon: <MaterialCommunityIcons name="hand-heart-outline" size={20} color={colors.primary} />,
      title: 'Help with your Trybe',
      subtitle: 'Find the right kind of help',
      onPress: () => setHelpOpen(true),
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header stays fixed while the page scrolls. */}
      <View style={styles.header}>
        <Logo size={36} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Notifications, new"
          style={({ pressed }) => [styles.bell, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="notifications-outline" size={18} color={colors.green} />
          <View style={styles.bellDot} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title} accessibilityRole="header">
          Your Trybe
        </Text>

        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            {/* PLACEHOLDER avatar until profile photos come from Trybe Identity. */}
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.name}>{name}</Text>
              <Text style={styles.parish}>{parishName}</Text>
              <View style={[styles.wing, !wing && { display: 'none' }]}>
                <Text style={styles.wingText}>{wing}</Text>
              </View>
            </View>
          </View>
          {bio ? <Text style={styles.bio}>{bio}</Text> : null}
          <Text style={styles.editBio} accessibilityRole="button">
            Edit bio
          </Text>
        </View>

        <View style={styles.tiles}>
          <Tile
            icon={<Ionicons name="calendar-outline" size={22} color={colors.primary} />}
            title="Registrations"
            subtitle="Your passes & plans"
          />
          <Tile
            icon={<Ionicons name="bookmark-outline" size={22} color={colors.primary} />}
            title="Saved items"
            subtitle="Your private saves"
          />
        </View>

        <Text style={styles.sectionTitle} accessibilityRole="header">
          Make it yours
        </Text>
        <RowGroup rows={makeItYours} />

        <Text style={styles.sectionTitle} accessibilityRole="header">
          Your account
        </Text>
        <RowGroup rows={account} />

        <Button
          variant="link"
          label={signingOut ? 'Signing out…' : 'Sign out'}
          loading={signingOut}
          onPress={confirmSignOut}
          style={styles.signOut}
        />
      </ScrollView>

      <HelpSheet visible={helpOpen} onClose={() => setHelpOpen(false)} />
    </SafeAreaView>
  );
}

function Tile({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle: string }) {
  return (
    <Pressable accessibilityRole="button" style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
      {icon}
      <Text style={styles.tileTitle}>{title}</Text>
      <Text style={styles.rowSub}>{subtitle}</Text>
    </Pressable>
  );
}

function RowGroup({ rows }: { rows: Row[] }) {
  return (
    <View style={styles.group}>
      {rows.map((row, i) => (
        <Fragment key={row.id}>
          <Pressable
            onPress={row.onPress}
            accessibilityRole="button"
            accessibilityLabel={`${row.title}. ${row.subtitle}`}
            style={({ pressed }) => [
              styles.row,
              i === 0 && styles.rowFirst,
              i === rows.length - 1 && styles.rowLast,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.rowIcon}>{row.icon}</View>
            <View style={styles.flex}>
              <Text style={styles.rowTitle}>{row.title}</Text>
              <Text style={styles.rowSub}>{row.subtitle}</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={colors.text} />
          </Pressable>
        </Fragment>
      ))}
    </View>
  );
}

const cardShadow = {
  shadowColor: '#6C5BD4',
  shadowOpacity: 0.06,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 3 },
  elevation: 1,
} as const;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  pressed: { backgroundColor: colors.primarySofter },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: colors.background,
  },
  bell: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
  scroll: { paddingHorizontal: spacing.screen, paddingTop: 16, paddingBottom: 24 },
  title: { fontFamily: fonts.semibold, fontSize: 26, color: colors.ink },
  profileCard: {
    marginTop: 20,
    padding: 20,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    ...cardShadow,
  },
  profileRow: { flexDirection: 'row', gap: 16 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#8B4A2B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.semibold, fontSize: 24, color: colors.white },
  name: { fontFamily: fonts.semibold, fontSize: 22, color: colors.ink },
  parish: { fontFamily: fonts.regular, fontSize: 13, color: colors.text, marginTop: 4 },
  wing: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  wingText: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.primaryDark },
  bio: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.ink, marginTop: 16 },
  editBio: { fontFamily: fonts.medium, fontSize: 14, color: colors.primaryDark, marginTop: 16 },
  tiles: { flexDirection: 'row', gap: 12, marginTop: 20 },
  tile: {
    flex: 1,
    padding: 16,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    ...cardShadow,
  },
  tileTitle: { fontFamily: fonts.semibold, fontSize: 14.5, color: colors.ink, marginTop: 14 },
  sectionTitle: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.ink,
    marginTop: 28,
    marginBottom: 12,
  },
  group: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    ...cardShadow,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingHorizontal: 16, paddingVertical: 12 },
  rowFirst: { paddingTop: 18, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl },
  rowLast: { paddingBottom: 18, borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
  rowIcon: { width: 22, alignItems: 'center', paddingTop: 2 },
  rowTitle: { fontFamily: fonts.medium, fontSize: 15, color: colors.ink },
  rowSub: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.textMuted, marginTop: 4 },
  signOut: { marginTop: 20 },
});
