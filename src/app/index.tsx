import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { homeFor } from '@/auth/routing';
import { Button } from '@/components/Button';
import { colors, fonts } from '@/theme';

/** Length of assets/trybe360.gif (137 frames, 5.0s). */
const HOLD_MS = 5000;
/** The GIF's own background, so the edges blend in. */
const GIF_BACKGROUND = '#FAFAFA';

/** Start · Logo hold (animated brand intro) — then route by session: Welcome, onboarding or Today. */
export default function LogoHold() {
  const { status, member, error, busy, reloadMember } = useAuth();
  const [held, setHeld] = useState(false);
  const [gifReady, setGifReady] = useState(false);

  // Play the whole animation: count HOLD_MS from when the GIF is decoded and
  // showing (it's large, so that can take a moment), not from mount.
  useEffect(() => {
    if (!gifReady) return;
    const t = setTimeout(() => setHeld(true), HOLD_MS);
    return () => clearTimeout(t);
  }, [gifReady]);

  // Safety net: never wait more than this, even if the GIF fails to load.
  useEffect(() => {
    const t = setTimeout(() => setHeld(true), HOLD_MS + 4000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!held) return;
    if (status === 'signedOut') router.replace('/welcome');
    else if (status === 'signedIn' && member) router.replace(homeFor(member));
  }, [held, status, member]);

  // Signed in, but the profile couldn't load (e.g. offline).
  const stuck = held && status === 'signedIn' && !member && !busy && !!error;

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/trybe360.gif')}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        autoplay
        onDisplay={() => setGifReady(true)}
        onError={() => setHeld(true)}
        accessibilityLabel="RCCG NYAYA Trybe360°"
      />
      {stuck ? (
        <View style={styles.error}>
          <Text style={styles.errorText}>{error}</Text>
          <Button label="Try again" variant="secondary" onPress={() => void reloadMember()} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GIF_BACKGROUND,
    paddingHorizontal: 32,
  },
  error: { position: 'absolute', bottom: 80, left: 32, right: 32, gap: 12 },
  errorText: { fontFamily: fonts.regular, fontSize: 13.5, color: colors.text, textAlign: 'center' },
});
