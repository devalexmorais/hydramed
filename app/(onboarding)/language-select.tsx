import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore, useIsDark } from '@/stores/useSettingsStore';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/lib/theme';

const LANGUAGES = [
  { label: 'English', value: 'en' },
  { label: 'Português (Brasil)', value: 'pt-BR' },
  { label: 'Español', value: 'es' },
];

export default function LanguageSelectScreen() {
  const { saveLocale } = useAuthStore();
  const setLocale = useSettingsStore((s) => s.setLocale);
  const isDark = useIsDark();

  const handleSelect = async (locale: string) => {
    setLocale(locale);
    await saveLocale(locale);
    router.replace('/(onboarding)/welcome');
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.dark.background : colors.light.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: isDark ? colors.dark.text : colors.light.text }]}>
          Choose your language
        </Text>
        <Text style={[styles.subtitle, { color: isDark ? colors.dark.textSecondary : colors.light.textSecondary }]}>
          Selecione o idioma
        </Text>
        <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.value}
              onPress={() => handleSelect(lang.value)}
              style={[
                styles.option,
                { backgroundColor: isDark ? colors.dark.surface : colors.light.surface },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.optionText, { color: isDark ? colors.dark.text : colors.light.text }]}>
                {lang.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, textAlign: 'center' },
  subtitle: { fontSize: fontSize.md, textAlign: 'center', marginTop: spacing.sm },
  option: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.light.border,
    alignItems: 'center',
  },
  optionText: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold },
});
