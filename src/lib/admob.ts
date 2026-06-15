import { Platform } from 'react-native';

let mobileAdsModule: typeof import('react-native-google-mobile-ads') | null = null;

try {
  mobileAdsModule = require('react-native-google-mobile-ads');
} catch {
  // Native module not available
}

export const AD_UNIT_IDS = {
  banner: __DEV__
    ? 'ca-app-pub-3940256099942544/6300978111'
    : Platform.select({
        android: 'ca-app-pub-4209407061463021/9483822515',
        ios: 'ca-app-pub-4209407061463021/6203053059',
      }) || 'ca-app-pub-4209407061463021/9483822515',
  interstitial: __DEV__
    ? 'ca-app-pub-3940256099942544/1033173712'
    : 'ca-app-pub-xxxxxxxxxxxxx/yyyyyyyyyyyyyy',
  appOpen: __DEV__
    ? 'ca-app-pub-3940256099942544/3419835294'
    : Platform.select({
        android: 'ca-app-pub-4209407061463021/5200921013',
        ios: 'ca-app-pub-4209407061463021/4310216024',
      }) || 'ca-app-pub-4209407061463021/4310216024',
};

export async function initializeAdMob() {
  if (!mobileAdsModule) return;
  const { default: mobileAds } = mobileAdsModule;
  await mobileAds().initialize();
}

export { mobileAdsModule };
