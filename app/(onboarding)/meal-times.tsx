import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/lib/theme';
import { useIsDark } from '@/stores/useSettingsStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTranslation } from '@/i18n';
import { formatTimeInput } from '@/lib/utils';

const MEALS = [
  { key: 'breakfastTime' as const, icon: '☕', labelKey: 'onboard.breakfast', placeholderKey: 'onboard.breakfastPlaceholder' },
  { key: 'lunchTime' as const, icon: '🥗', labelKey: 'onboard.lunch', placeholderKey: 'onboard.lunchPlaceholder' },
  { key: 'dinnerTime' as const, icon: '🍝', labelKey: 'onboard.dinner', placeholderKey: 'onboard.dinnerPlaceholder' },
];

export default function MealTimesScreen() {
  const { t } = useTranslation();
  const { user, saveUser } = useAuthStore();
  const schema = z.object({
    breakfastTime: z.string().regex(/^\d{2}:\d{2}$/, t('onboard.validTime')),
    lunchTime: z.string().regex(/^\d{2}:\d{2}$/, t('onboard.validTime')),
    dinnerTime: z.string().regex(/^\d{2}:\d{2}$/, t('onboard.validTime')),
  });
  type FormData = z.infer<typeof schema>;
  const isDark = useIsDark();

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      breakfastTime: user?.breakfastTime || '08:00',
      lunchTime: user?.lunchTime || '12:00',
      dinnerTime: user?.dinnerTime || '19:00',
    },
  });

  const onSubmit = async (data: FormData) => {
    await saveUser({
      breakfastTime: data.breakfastTime,
      lunchTime: data.lunchTime,
      dinnerTime: data.dinnerTime,
    });
    router.push('/(onboarding)/sleep-time');
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.dark.background : colors.light.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? colors.dark.text : colors.light.text }]}>
          {t('onboard.mealTimes')}
        </Text>
        <Text style={[styles.subtitle, { color: isDark ? colors.dark.textSecondary : colors.light.textSecondary }]}>
          {t('onboard.mealTimesDesc')}
        </Text>
      </View>

      <View style={styles.cards}>
        {MEALS.map((meal) => (
          <View
            key={meal.key}
            style={[
              styles.card,
              {
                backgroundColor: isDark ? colors.dark.surface : colors.light.surface,
                borderColor: isDark ? colors.dark.border : colors.light.border,
              },
            ]}
          >
            <View style={styles.cardLeft}>
              <Text style={styles.mealIcon}>{meal.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.mealLabel, { color: isDark ? colors.dark.text : colors.light.text }]}>
                  {t(meal.labelKey)}
                </Text>
              </View>
            </View>
            <Controller
              control={control}
              name={meal.key}
              render={({ field: { onChange, value } }) => (
                <Input
                  placeholder={t(meal.placeholderKey)}
                  value={value}
                  onChangeText={(v) => onChange(formatTimeInput(v))}
                  keyboardType="number-pad"
                  maxLength={5}
                  error={errors[meal.key]?.message}
                  containerStyle={{ marginBottom: 0, flex: 0, width: 110 }}
                  style={{ textAlign: 'center' }}
                />
              )}
            />
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Button title={t('onboard.continue')} onPress={handleSubmit(onSubmit)} size="lg" style={{ width: '100%' }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.lg },
  header: { alignItems: 'center', gap: spacing.sm },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, textAlign: 'center' },
  subtitle: { fontSize: fontSize.md, textAlign: 'center', lineHeight: 24, paddingHorizontal: spacing.md, marginBottom: spacing.md },
  cards: { flex: 1, justifyContent: 'center', gap: spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  mealIcon: { fontSize: 28 },
  mealLabel: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  footer: { paddingBottom: spacing.xxl, paddingTop: spacing.md },
});
