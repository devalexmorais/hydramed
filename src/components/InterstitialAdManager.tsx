import { ReactNode, createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { mobileAdsModule, AD_UNIT_IDS, waitForAdMobInit } from '@/lib/admob';

interface InterstitialContextType {
  showInterstitial: () => void;
}

const InterstitialContext = createContext<InterstitialContextType>({
  showInterstitial: () => {},
});

export const useInterstitial = () => useContext(InterstitialContext);

export function InterstitialAdManager({ children }: { children: ReactNode }) {
  const adRef = useRef<any>(null);
  const loadedRef = useRef(false);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastShowRef = useRef(0);

  useEffect(() => {
    if (!mobileAdsModule) return;
    const { InterstitialAd, AdEventType } = mobileAdsModule;

    async function loadAd() {
      await waitForAdMobInit();
      const ad = InterstitialAd.createForAdRequest(AD_UNIT_IDS.interstitial);
      adRef.current = ad;
      loadedRef.current = false;
      const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
        loadedRef.current = true;
        unsubLoaded();
      });
      ad.addAdEventListener(AdEventType.CLOSED, () => {
        loadAd();
      });
      ad.addAdEventListener(AdEventType.ERROR, () => {
        retryRef.current = setTimeout(loadAd, 5000);
      });
      ad.load();
    }

    loadAd();

    return () => {
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, []);

  const showInterstitial = useCallback(() => {
    const now = Date.now();
    if (now - lastShowRef.current < 60000) return;
    if (adRef.current && loadedRef.current) {
      lastShowRef.current = now;
      // Enable immersive mode so the "Skip Ad" / close button is not
      // obscured by the Android status bar / notification area.
      if (typeof adRef.current.setImmersiveMode === 'function') {
        adRef.current.setImmersiveMode(true);
      }
      adRef.current.show();
    }
  }, []);

  if (!mobileAdsModule) return <>{children}</>;

  return (
    <InterstitialContext.Provider value={{ showInterstitial }}>
      {children}
    </InterstitialContext.Provider>
  );
}
