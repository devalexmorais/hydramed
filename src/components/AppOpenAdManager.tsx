import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { mobileAdsModule, AD_UNIT_IDS, waitForAdMobInit } from '@/lib/admob';

export function AppOpenAdManager() {
  const appState = useRef(AppState.currentState);
  const adRef = useRef<any>(null);
  const loadedRef = useRef(false);
  const initialShowDone = useRef(false);
  const pendingInitialShow = useRef(false);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!mobileAdsModule) return;
    const { AppOpenAd, AdEventType } = mobileAdsModule;

    function showAd() {
      if (adRef.current && loadedRef.current) {
        // Enable immersive mode so the "Skip Ad" / close button is not
        // obscured by the Android status bar / notification area.
        if (typeof adRef.current.setImmersiveMode === 'function') {
          adRef.current.setImmersiveMode(true);
        }
        adRef.current.show();
      }
    }

    async function loadAd() {
      await waitForAdMobInit();
      const ad = AppOpenAd.createForAdRequest(AD_UNIT_IDS.appOpen);
      adRef.current = ad;
      loadedRef.current = false;
      const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
        loadedRef.current = true;
        unsubLoaded();
        if (pendingInitialShow.current && !initialShowDone.current) {
          initialShowDone.current = true;
          showAd();
        }
      });
      ad.addAdEventListener(AdEventType.CLOSED, () => {
        loadAd();
      });
      ad.addAdEventListener(AdEventType.ERROR, () => {
        retryTimeoutRef.current = setTimeout(loadAd, 5000);
      });
      ad.load();
    }

    loadAd();

    const initialTimer = setTimeout(() => {
      if (!initialShowDone.current) {
        if (loadedRef.current) {
          initialShowDone.current = true;
          showAd();
        } else {
          pendingInitialShow.current = true;
        }
      }
    }, 5000);

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        showAd();
      }
      appState.current = nextState;
    });

    return () => {
      clearTimeout(initialTimer);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      subscription.remove();
    };
  }, []);

  return null;
}
