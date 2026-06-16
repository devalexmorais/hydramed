import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { mobileAdsModule, AD_UNIT_IDS } from '@/lib/admob';

export function AppOpenAdManager() {
  const appState = useRef(AppState.currentState);
  const adRef = useRef<any>(null);
  const loadedRef = useRef(false);
  const initialShowDone = useRef(false);

  useEffect(() => {
    if (!mobileAdsModule) return;
    const { AppOpenAd, AdEventType } = mobileAdsModule;

    function loadAd() {
      const ad = AppOpenAd.createForAdRequest(AD_UNIT_IDS.appOpen);
      adRef.current = ad;
      loadedRef.current = false;
      const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
        loadedRef.current = true;
        unsubLoaded();
      });
      ad.addAdEventListener(AdEventType.CLOSED, () => {
        loadAd();
      });
      ad.load();
    }

    loadAd();

    const showAd = () => {
      if (adRef.current && loadedRef.current) {
        adRef.current.show().catch(() => {});
      }
    };

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        showAd();
      }
      appState.current = nextState;
    });

    return () => subscription.remove();
  }, []);

  return null;
}
