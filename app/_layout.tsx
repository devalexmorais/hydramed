import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore, useIsDark } from '@/stores/useSettingsStore';
import { getDatabase } from '@/db/database';
import { setNotificationHandler, setupNotificationCategories, setupNotificationResponseHandler } from '@/lib/notifications';
import { initializeAdMob } from '@/lib/admob';
import { AppOpenAdManager } from '@/components/AppOpenAdManager';
import { colors } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { loadUser, isLoading } = useAuthStore();
  const isDark = useIsDark();
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    const cleanup = setupNotificationResponseHandler();

    async function init() {
      await getDatabase();
      await loadUser();
      setNotificationHandler();
      const locale = useSettingsStore.getState().locale;
      await setupNotificationCategories(locale);
      initializeAdMob();
      setDbReady(true);
      await SplashScreen.hideAsync();
    }
    init();

    return () => cleanup();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppOpenAdManager />
      {!dbReady || isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? colors.dark.background : colors.light.background }}>
          <ActivityIndicator size="large" color={isDark ? colors.dark.primary : colors.light.primary} />
        </View>
      ) : (
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="medication/add" options={{ presentation: 'modal' }} />
            <Stack.Screen name="medication/[id]" options={{ presentation: 'modal' }} />
            <Stack.Screen name="history" />
            <Stack.Screen name="statistics" />
            <Stack.Screen name="notification-schedule" />
          </Stack>
        </SafeAreaView>
      )}
    </SafeAreaProvider>
  );
}
