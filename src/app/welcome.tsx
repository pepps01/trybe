import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { homeFor } from '@/auth/routing';
import { Button } from '@/components/Button';
import { HeroArt } from '@/components/HeroArt';
import { IdentitySheet } from '@/components/IdentitySheet';
import { Logo } from '@/components/Logo';
import { Notice } from '@/components/Notice';
import { colors, fonts, spacing } from '@/theme';

type Mode = 'idle' | 'get-started' | 'sign-in';

/** Start · Welcome (+ Signing in, + Trybe Identity hand-off sheet) */
export default function Welcome() {
  const auth = useAuth();
  const [mode, setMode] = useState<Mode>('idle');

  // "Get started" opens Identity on its create-account page; "Sign in" on its login page.
  const startHandoff = async (next: Exclude<Mode, 'idle'>) => {
    setMode(next);
    const member = await auth.signIn(next === 'get-started' ? 'create' : undefined);
    setMode('idle');
    if (member) router.replace(homeFor(member));
  };

  const cancel = () => {
    auth.cancelSignIn();
    setMode('idle');
  };

  const working = mode !== 'idle' || auth.busy;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} bounces={false}>
        <View style={styles.logo}>
          <Logo size={32} />
        </View>

        <HeroArt style={styles.hero} />

        <Text style={styles.headline} accessibilityRole="header">
          United in love, growing together.
        </Text>
        <Text style={styles.subhead}>
          Programmes near you, a Circle for your season and learning that fits your life. Setup
          takes about a minute.
        </Text>

        <View style={styles.spacer} />

        {auth.error && !working ? (
          <View style={styles.error}>
            <Notice message={auth.error} />
          </View>
        ) : null}

        <Button
          label="Get started"
          arrow="after"
          onPress={() => startHandoff('get-started')}
          disabled={working}
        />
        <Button
          variant="link"
          label={mode === 'sign-in' ? 'Signing in with RCCG Identity...' : 'Already part of Trybe? Sign in'}
          onPress={() => startHandoff('sign-in')}
          disabled={working}
          style={styles.signIn}
        />

        <Text style={styles.footer}>An initiative of RCCG National Young Adults & Youth Affairs</Text>
      </ScrollView>

      <IdentitySheet visible={auth.opening} onClose={cancel} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.screen, paddingTop: 12, paddingBottom: 12 },
  logo: { alignItems: 'center', marginBottom: 16 },
  hero: { width: '100%' },
  headline: {
    fontFamily: fonts.extrabold,
    fontSize: 30,
    lineHeight: 36,
    color: colors.inkHero,
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 12,
  },
  subhead: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
    textAlign: 'center',
    marginTop: 14,
    paddingHorizontal: 8,
  },
  spacer: { flex: 1, minHeight: 32 },
  error: { marginBottom: 12 },
  signIn: { marginTop: 8 },
  footer: {
    fontFamily: fonts.regular,
    fontSize: 10.5,
    color: colors.textSubtle,
    textAlign: 'center',
    marginTop: 20,
  },
});
