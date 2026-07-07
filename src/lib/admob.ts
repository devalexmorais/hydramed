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
  appOpen: __DEV__
    ? 'ca-app-pub-3940256099942544/3419835294'
    : Platform.select({
        android: 'ca-app-pub-4209407061463021/5200921013',
        ios: 'ca-app-pub-4209407061463021/6813852179',
      }) || 'ca-app-pub-4209407061463021/4310216024',
  interstitial: __DEV__
    ? 'ca-app-pub-3940256099942544/4411468910'
    : Platform.select({
        android: 'ca-app-pub-4209407061463021/3094099017',
        ios: 'ca-app-pub-4209407061463021/3094099017',
      }) || 'ca-app-pub-4209407061463021/3094099017',
};

let adMobReady = false;
let adMobInitPromise: Promise<void> | null = null;
let adMobInitResolve: (() => void) | null = null;

export async function initializeAdMob() {
  if (adMobReady) return;
  if (!mobileAdsModule) return;
  const { default: mobileAds } = mobileAdsModule;
  await mobileAds().initialize();
  adMobReady = true;
  if (adMobInitResolve) adMobInitResolve();
}

export function waitForAdMobInit(): Promise<void> {
  if (adMobReady) return Promise.resolve();
  if (!mobileAdsModule) return Promise.resolve();
  if (!adMobInitPromise) {
    adMobInitPromise = new Promise((resolve) => {
      adMobInitResolve = resolve;
    });
  }
  return adMobInitPromise;
}

export { mobileAdsModule };
