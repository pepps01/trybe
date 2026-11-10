import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabBarButton } from '@/components/TabBarButton';
import { useAuth } from '@/auth/AuthProvider';
import { colors, fonts } from '@/theme';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { member } = useAuth();
  const initial = (member?.name ?? 'T').charAt(0).toUpperCase();

  return (
    <Tabs style={styles.root}>
      <TabSlot />
      <TabList asChild>
        {/* Slot children must receive a flat style object, not an array. */}
        <View style={StyleSheet.flatten([styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }])}>
          <TabTrigger name="today" href="/today" asChild>
            <TabBarButton label="Today" icon="home-outline" focusedIcon="home" />
          </TabTrigger>
          <TabTrigger name="whats-on" href="/whats-on" asChild>
            <TabBarButton label="What’s on" icon="calendar-outline" />
          </TabTrigger>
          <TabTrigger name="circles" href="/circles" asChild>
            <TabBarButton label="Circles" icon="people-outline" />
          </TabTrigger>
          <TabTrigger name="grow" href="/grow" asChild>
            <TabBarButton label="Grow" icon="school-outline" />
          </TabTrigger>
          <TabTrigger name="me" href="/me" asChild>
            <TabBarButton
              label="Me"
              renderIcon={() => (
                // PLACEHOLDER avatar until profile photos come from Trybe Identity.
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initial}</Text>
                </View>
              )}
            />
          </TabTrigger>
        </View>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  bar: {
    flexDirection: 'row',
    gap: 4,
    paddingTop: 6,
    paddingHorizontal: 8,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#8B4A2B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.semibold, fontSize: 11, color: colors.white },
});
