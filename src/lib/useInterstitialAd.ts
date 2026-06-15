import { useEffect, useRef } from 'react';
import { mobileAdsModule, AD_UNIT_IDS } from '@/lib/admob';

export function useInterstitialAd() {
  const interstitialRef = useRef<any>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!mobileAdsModule) return;
    const { InterstitialAd, AdEventType } = mobileAdsModule;

    const ad = InterstitialAd.createForAdRequest(AD_UNIT_IDS.interstitial);
    interstitialRef.current = ad;

    const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      loadedRef.current = true;
      unsubLoaded();
    });
    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      loadedRef.current = false;
    });

    ad.load();

    return () => {
      unsubLoaded();
      unsubClosed();
    };
  }, []);

  function show() {
    if (interstitialRef.current && loadedRef.current) {
      interstitialRef.current.show();
    }
  }

  return { show };
}
