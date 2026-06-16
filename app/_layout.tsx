import { useEffect, useState, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { View, Text, Image, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore, useIsDark } from '@/stores/useSettingsStore';
import { getDatabase } from '@/db/database';
import { setNotificationHandler, setupNotificationCategories, setupNotificationResponseHandler } from '@/lib/notifications';
import { initializeAdMob, mobileAdsModule, AD_UNIT_IDS } from '@/lib/admob';
import { AppOpenAdManager } from '@/components/AppOpenAdManager';
import { colors, spacing, fontSize, fontWeight } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { loadUser, isLoading } = useAuthStore();
  const isDark = useIsDark();
  const [dbReady, setDbReady] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const adRef = useRef<any>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    const cleanup = setupNotificationResponseHandler();

    async function init() {
      await getDatabase();
      await loadUser();
      setNotificationHandler();
      const locale = useSettingsStore.getState().locale;
      await setupNotificationCategories(locale);
      initializeAdMob();
      await new Promise((r) => setTimeout(r, 3000));

      const isOnboarded = useAuthStore.getState().isOnboarded;
      const languageSelected = useAuthStore.getState().languageSelected;

      if (!languageSelected && mobileAdsModule) {
        const { InterstitialAd, AdEventType } = mobileAdsModule;
        const ad = InterstitialAd.createForAdRequest(AD_UNIT_IDS.interstitial);
        adRef.current = ad;

        const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
          unsubLoaded();
          setShowAd(true);
          ad.show().catch(() => {
            setDbReady(true);
          });
        });

        ad.addAdEventListener(AdEventType.CLOSED, () => {
          if (!doneRef.current) {
            doneRef.current = true;
            setShowAd(false);
            setDbReady(true);
          }
        });

        ad.addAdEventListener(AdEventType.ERROR, () => {
          if (!doneRef.current) {
            doneRef.current = true;
            setDbReady(true);
          }
        });

        ad.load();
      } else {
        setDbReady(true);
      }

      await SplashScreen.hideAsync();
    }
    init();

    return () => cleanup();
  }, []);

  if (showAd) {
    return (
      <View style={{ flex: 1, backgroundColor: isDark ? colors.dark.background : colors.light.background }} />
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppOpenAdManager />
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
    </SafeAreaProvider>
  );
}