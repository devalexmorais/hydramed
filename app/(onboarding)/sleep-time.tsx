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

const TIMES = [
  { key: 'wakeUpTime' as const, icon: '🌅', labelKey: 'onboard.wakeUp', placeholderKey: 'onboard.wakeUpPlaceholder' },
  { key: 'sleepTime' as const, icon: '🌙', labelKey: 'onboard.sleep', placeholderKey: 'onboard.sleepPlaceholder' },
];

export default function SleepTimeScreen() {
  const { t } = useTranslation();
  const { user, saveUser } = useAuthStore();
  const schema = z.object({
    wakeUpTime: z.string().regex(/^\d{2}:\d{2}$/, t('onboard.validTime')),
    sleepTime: z.string().regex(/^\d{2}:\d{2}$/, t('onboard.validTime')),
  });
  type FormData = z.infer<typeof schema>;
  const isDark = useIsDark();

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      wakeUpTime: user?.wakeUpTime || '07:00',
      sleepTime: user?.sleepTime || '23:00',
    },
  });

  const onSubmit = async (data: FormData) => {
    await saveUser({
      wakeUpTime: data.wakeUpTime,
      sleepTime: data.sleepTime,
    });
    router.push('/(onboarding)/summary');
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.dark.background : colors.light.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? colors.dark.text : colors.light.text }]}>
          {t('onboard.sleepTitle')}
        </Text>
        <Text style={[styles.subtitle, { color: isDark ? colors.dark.textSecondary : colors.light.textSecondary }]}>
          {t('onboard.sleepDesc')}
        </Text>
      </View>

      <View style={styles.cards}>
        {TIMES.map((item) => (
          <View
            key={item.key}
            style={[
              styles.card,
              {
                backgroundColor: isDark ? colors.dark.surface : colors.light.surface,
                borderColor: isDark ? colors.dark.border : colors.light.border,
              },
            ]}
          >
            <View style={styles.cardLeft}>
              <Text style={styles.icon}>{item.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: isDark ? colors.dark.text : colors.light.text }]}>
                  {t(item.labelKey)}
                </Text>
              </View>
            </View>
            <Controller
              control={control}
              name={item.key}
              render={({ field: { onChange, value } }) => (
                <Input
                  placeholder={t(item.placeholderKey)}
                  value={value}
                  onChangeText={(v) => onChange(formatTimeInput(v))}
                  keyboardType="number-pad"
                  maxLength={5}
                  error={errors[item.key]?.message}
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
  icon: { fontSize: 28 },
  label: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  footer: { paddingBottom: spacing.xxl, paddingTop: spacing.md },
});
