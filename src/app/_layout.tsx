import {
  WorkSans_400Regular,
  WorkSans_500Medium,
  WorkSans_600SemiBold,
  WorkSans_700Bold,
  WorkSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/work-sans';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AuthProvider, useAuth } from '@/auth/AuthProvider';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    WorkSans_400Regular,
    WorkSans_500Medium,
    WorkSans_600SemiBold,
    WorkSans_700Bold,
    WorkSans_800ExtraBold,
  });

  if (!fontsLoaded && !fontError) return null;

  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <RootStack />
    </AuthProvider>
  );
}

function RootStack() {
  const { status } = useAuth();

  // Keep the native splash up until we know whether a saved session exists.
  useEffect(() => {
    if (status !== 'restoring') SplashScreen.hideAsync();
  }, [status]);

  if (status === 'restoring') return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" options={{ animation: 'none' }} />
      <Stack.Screen name="welcome" options={{ animation: 'fade' }} />

      {/*
        Signed-in screens. When the session is cleared (sign out, expired token),
        Expo Router removes these from history and redirects to Welcome.
      */}
      <Stack.Protected guard={status === 'signedIn'} redirectTo="/welcome">
        <Stack.Screen name="confirm" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="parish" />
        <Stack.Screen name="season" />
        <Stack.Screen name="you-belong" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="whole-stats" />
        <Stack.Screen name="programme/[slug]" />
        <Stack.Screen name="programme/[slug]/pass" />
      </Stack.Protected>
    </Stack>
  );
}
