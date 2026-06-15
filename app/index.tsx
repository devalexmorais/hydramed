import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';

export default function Index() {
  const { isOnboarded, languageSelected } = useAuthStore();
  if (!languageSelected) return <Redirect href="/(onboarding)/language-select" />;
  return <Redirect href={isOnboarded ? '/(tabs)' : '/(onboarding)/welcome'} />;
}
