import { useRef } from 'react';
import { Platform, View } from 'react-native';
import { mobileAdsModule, AD_UNIT_IDS } from '@/lib/admob';

export function AdBanner() {
  if (!mobileAdsModule) return null;
  const { BannerAd, BannerAdSize, useForeground } = mobileAdsModule;
  const bannerRef = useRef<any>(null);

  useForeground(() => {
    Platform.OS === 'ios' && bannerRef.current?.load();
  });

  return (
    <View style={{ alignItems: 'center' }}>
      <BannerAd
        ref={bannerRef}
        unitId={AD_UNIT_IDS.banner}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      />
    </View>
  );
}
