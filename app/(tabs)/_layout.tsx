import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useIsDark } from '@/stores/useSettingsStore';
import { useTranslation } from '@/i18n';
import { colors } from '@/lib/theme';
import { AdBanner } from '@/components/AdBanner';

const TAB_ICONS: Record<string, { focused: keyof typeof Ionicons.glyphMap; default: keyof typeof Ionicons.glyphMap }> = {
  index: { focused: 'home', default: 'home-outline' },
  medications: { focused: 'medkit', default: 'medkit-outline' },
  water: { focused: 'water', default: 'water-outline' },
  calendar: { focused: 'calendar', default: 'calendar-outline' },
  settings: { focused: 'settings', default: 'settings-outline' },
};

export default function TabLayout() {
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        initialRouteName="index"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: isDark ? colors.dark.primary : colors.light.primary,
          tabBarInactiveTintColor: isDark ? colors.dark.textTertiary : colors.light.textTertiary,
          tabBarStyle: {
            backgroundColor: isDark ? colors.dark.surface : colors.light.surface,
            borderTopColor: isDark ? colors.dark.border : colors.light.border,
            borderTopWidth: 1,
            height: 58,
            paddingBottom: 6,
            paddingTop: 4,
            ...Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -3 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
              },
              android: {
                elevation: 8,
              },
            }),
          },
          tabBarItemStyle: {
            paddingVertical: 0,
            minHeight: 0,
            height: 48,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
            marginTop: 1,
            marginBottom: 2,
            lineHeight: 12,
          },
          tabBarIcon: ({ focused, color }) => {
            const icons = TAB_ICONS[route.name];
            const iconName = focused ? icons.focused : icons.default;

            if (route.name === 'index') {
              const bg = focused
                ? (isDark ? colors.dark.primary : colors.light.primary)
                : (isDark ? colors.dark.surfaceSecondary : colors.light.primaryLight);
              const iconColor = focused
                ? '#FFFFFF'
                : (isDark ? colors.dark.primary : colors.light.primary);
              
              return (
                <View style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: bg,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: -16,
                  shadowColor: isDark ? colors.dark.primary : colors.light.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: focused ? 0.3 : 0.1,
                  shadowRadius: 6,
                  elevation: 5,
                }}>
                  <Ionicons name="home" size={26} color={iconColor} />
                </View>
              );
            }
            return <Ionicons name={iconName} size={22} color={color} />;
          },
        })}
      >
        <Tabs.Screen name="calendar" options={{ title: t('tabs.calendar') }} />
        <Tabs.Screen name="water" options={{ title: t('tabs.water') }} />
        <Tabs.Screen name="index" options={{ title: t('tabs.home'), tabBarLabel: () => null }} />
        <Tabs.Screen name="medications" options={{ title: t('tabs.medications') }} />
        <Tabs.Screen name="settings" options={{ title: t('tabs.settings') }} />
      </Tabs>
      <AdBanner />
    </View>
  );
}
