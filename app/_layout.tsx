import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { View, Text, Image, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore, useIsDark } from '@/stores/useSettingsStore';
import { useMedicationStore } from '@/stores/useMedicationStore';
import { getDatabase } from '@/db/database';
import { setNotificationHandler, setupNotificationCategories, setupNotificationResponseHandler, rescheduleAllNotifications } from '@/lib/notifications';
import { initializeAdMob } from '@/lib/admob';
import { AppOpenAdManager } from '@/components/AppOpenAdManager';
import { InterstitialAdManager } from '@/components/InterstitialAdManager';
import { useDayChangeRefresh } from '@/hooks/useDayChangeRefresh';
import { colors, spacing, fontSize, fontWeight } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { loadUser, isLoading } = useAuthStore();
  const isDark = useIsDark();
  const [dbReady, setDbReady] = useState(false);

  useDayChangeRefresh();

  useEffect(() => {
    const cleanup = setupNotificationResponseHandler();

    async function init() {
      await getDatabase();
      await loadUser();
      setNotificationHandler();
      const locale = useSettingsStore.getState().locale;
      await setupNotificationCategories(locale);

      if (useAuthStore.getState().isOnboarded && useSettingsStore.getState().notificationsEnabled) {
        await useMedicationStore.getState().loadMedications();
        await rescheduleAllNotifications(locale);
      }

      await initializeAdMob();
      await new Promise((r) => setTimeout(r, 3000));

      setDbReady(true);
      await SplashScreen.hideAsync();
    }
    init();

    return () => cleanup();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppOpenAdManager />
      <InterstitialAdManager>
      {!dbReady || isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0EA5E9', gap: spacing.lg }}>
          <Image source={require('../assets/tranparente.png')} style={{ width: 120, height: 120 }} resizeMode="contain" />
          <Text style={{ fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: '#FFFFFF' }}>HydraMed</Text>
          <ActivityIndicator size="large" color="#FFFFFF" />
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
      </InterstitialAdManager>
    </SafeAreaProvider>
  );
}