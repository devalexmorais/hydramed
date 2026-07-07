import { Stack } from 'expo-router';
import { useIsDark } from '@/stores/useSettingsStore';
import { colors } from '@/lib/theme';
import { useTranslation } from '@/i18n';

export default function OnboardingLayout() {
  const isDark = useIsDark();
  const { t } = useTranslation();

  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: isDark ? colors.dark.background : colors.light.background },
        headerTintColor: isDark ? colors.dark.text : colors.light.text,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="language-select" options={{ headerShown: false }} />
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="permissions" options={{ headerShown: false }} />
      <Stack.Screen name="profile-setup" options={{ headerShown: false }} />
      <Stack.Screen name="exercise-frequency" options={{ headerTitle: '' }} />
      <Stack.Screen name="meal-times" options={{ headerTitle: '' }} />
      <Stack.Screen name="sleep-time" options={{ headerTitle: '' }} />
      <Stack.Screen name="summary" options={{ headerTitle: '' }} />
    </Stack>
  );
}
