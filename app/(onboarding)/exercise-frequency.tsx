import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { useIsDark } from '@/stores/useSettingsStore';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/lib/theme';
import { useTranslation } from '@/i18n';

const FREQUENCIES = [
  { labelKey: 'onboard.exerciseNone', value: 0 },
  { labelKey: 'onboard.exerciseLight', value: 1 },
  { labelKey: 'onboard.exerciseModerate', value: 3 },
  { labelKey: 'onboard.exerciseActive', value: 5 },
  { labelKey: 'onboard.exerciseDaily', value: 7 },
] as const;

export default function ExerciseFrequencyScreen() {
  const { t } = useTranslation();
  const { user, saveUser } = useAuthStore();
  const isDark = useIsDark();

  const handleSelect = async (frequency: number) => {
    await saveUser({ exerciseFrequency: frequency });
    router.push('/(onboarding)/meal-times');
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.dark.background : colors.light.background }]}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>🏃</Text>
        </View>

        <Text style={[styles.title, { color: isDark ? colors.dark.text : colors.light.text }]}>
          {t('onboard.exercise')}
        </Text>
        <Text style={[styles.subtitle, { color: isDark ? colors.dark.textSecondary : colors.light.textSecondary }]}>
          {t('onboard.exerciseDesc')}
        </Text>

        <View style={styles.options}>
          {FREQUENCIES.map((freq) => (
            <TouchableOpacity
              key={freq.value}
              onPress={() => handleSelect(freq.value)}
              style={[
                styles.option,
                {
                  backgroundColor: isDark ? colors.dark.surface : colors.light.surface,
                  borderColor: user?.exerciseFrequency === freq.value
                    ? colors.light.primary
                    : (isDark ? colors.dark.border : colors.light.border),
                },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.optionText, { color: isDark ? colors.dark.text : colors.light.text }]}>
                {t(freq.labelKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.lg },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.lg },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.light.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 48 },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, textAlign: 'center' },
  subtitle: { fontSize: fontSize.md, textAlign: 'center', lineHeight: 24, paddingHorizontal: spacing.md },
  options: { width: '100%', gap: spacing.md, marginTop: spacing.md },
  option: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  optionText: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold },
});
