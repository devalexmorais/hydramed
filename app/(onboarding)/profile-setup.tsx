import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { colors, spacing, fontSize, fontWeight } from '@/lib/theme';
import { useSettingsStore, useIsDark } from '@/stores/useSettingsStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTranslation } from '@/i18n';
import { scheduleAllHydrationReminders } from '@/lib/notifications';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileSetupScreen() {
  const { t, locale } = useTranslation();
  const { user, saveUser, completeOnboarding, isOnboarded } = useAuthStore();
  const isEditing = isOnboarded;
  const schema = z.object({
    name: z.string().min(1, t('onboard.validName')),
    age: z.string().regex(/^\d+$/, t('onboard.validNumber')),
    weight: z.string().regex(/^\d+(\.\d+)?$/, t('onboard.validWeight')),
    height: z.string().regex(/^\d+(\.\d+)?$/, t('onboard.validNumber')),
    waterGoal: z.string().regex(/^\d+$/, t('onboard.validNumber')),
    wakeUpTime: z.string().regex(/^\d{2}:\d{2}$/, t('onboard.validTime')),
    sleepTime: z.string().regex(/^\d{2}:\d{2}$/, t('onboard.validTime')),
  });
  type FormData = z.infer<typeof schema>;
  const isDark = useIsDark();

  const { control, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name || '',
      age: user?.age ? String(user.age) : '',
      weight: user?.weight ? String(user.weight) : '',
      height: user?.height ? String(user.height) : '',
      waterGoal: user?.waterGoal ? String(user.waterGoal) : '2000',
      wakeUpTime: user?.wakeUpTime || '07:00',
      sleepTime: user?.sleepTime || '23:00',
    },
  });

  const watchedWeight = watch('weight');
  const watchedHeight = watch('height');
  const w = watchedWeight ? parseFloat(watchedWeight) : 0;
  const h = watchedHeight ? parseFloat(watchedHeight) : 0;
  const suggestedGoal = w && h
    ? Math.round((w * 33 + h * 0.4) / 100) * 100
    : w
      ? Math.round(w * 33 / 100) * 100
      : null;

  const onSubmit = async (data: FormData) => {
    await saveUser({
      name: data.name,
      age: parseInt(data.age),
      weight: parseFloat(data.weight),
      height: parseFloat(data.height) || 0,
      waterGoal: parseInt(data.waterGoal),
      wakeUpTime: data.wakeUpTime,
      sleepTime: data.sleepTime,
    });
    const loc = useSettingsStore.getState().locale;
    await scheduleAllHydrationReminders(
      parseInt(data.waterGoal),
      data.wakeUpTime,
      data.sleepTime,
      loc
    );
    if (isEditing) {
      router.back();
    } else {
      await completeOnboarding();
      router.replace('/(tabs)');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={[
          styles.container,
          { backgroundColor: isDark ? colors.dark.background : colors.light.background },
        ]}
        contentContainerStyle={styles.content}
      >
        {isEditing ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: spacing.sm }}>
              <Ionicons name="arrow-back" size={24} color={isDark ? colors.dark.text : colors.light.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: isDark ? colors.dark.text : colors.light.text, marginBottom: 0, flex: 1 }]}>
              {t('settings.editProfile')}
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.title, { color: isDark ? colors.dark.text : colors.light.text }]}>
              {t('onboard.profileSetup')}
            </Text>
            <Text style={[styles.subtitle, { color: isDark ? colors.dark.textSecondary : colors.light.textSecondary }]}>
              {t('onboard.profileDesc')}
            </Text>
          </>
        )}

        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <Input label={t('onboard.name')} placeholder={t('onboard.namePlaceholder')} value={value} onChangeText={onChange} error={errors.name?.message} />
          )}
        />

        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Controller
              control={control}
              name="age"
              render={({ field: { onChange, value } }) => (
                <Input label={t('onboard.age')} placeholder={t('onboard.agePlaceholder')} keyboardType="numeric" value={value} onChangeText={onChange} error={errors.age?.message} />
              )}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Controller
              control={control}
              name="weight"
              render={({ field: { onChange, value } }) => (
                <Input label={t('onboard.weight')} placeholder={t('onboard.weightPlaceholder')} keyboardType="numeric" value={value} onChangeText={onChange} error={errors.weight?.message} />
              )}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Controller
              control={control}
              name="height"
              render={({ field: { onChange, value } }) => (
                <Input label={t('onboard.height')} placeholder={t('onboard.heightPlaceholder')} keyboardType="numeric" value={value} onChangeText={onChange} error={errors.height?.message} />
              )}
            />
          </View>
        </View>

        <Controller
          control={control}
          name="waterGoal"
          render={({ field: { onChange, value } }) => (
            <View>
              <Input
                label={t('onboard.waterGoal')}
                placeholder={t('onboard.waterGoalPlaceholder')}
                keyboardType="numeric"
                value={value}
                onChangeText={onChange}
                error={errors.waterGoal?.message}
              />
              {suggestedGoal ? (
                <Text
                  style={{
                    fontSize: fontSize.xs,
                    color: isDark ? colors.dark.textTertiary : colors.light.textTertiary,
                    marginTop: -spacing.sm,
                    marginBottom: spacing.sm,
                    textAlign: 'right',
                  }}
                >
                  {locale.startsWith('pt')
                    ? `Sugestão: ${suggestedGoal}ml baseado no seu peso e altura`
                    : locale.startsWith('es')
                      ? `Sugerencia: ${suggestedGoal}ml según tu peso y altura`
                      : `Suggested: ${suggestedGoal}ml based on your weight and height`}
                </Text>
              ) : null}
            </View>
          )}
        />

        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Controller
              control={control}
              name="wakeUpTime"
              render={({ field: { onChange, value } }) => (
                <Input label={t('onboard.wakeUp')} placeholder={t('onboard.wakeUpPlaceholder')} value={value} onChangeText={onChange} error={errors.wakeUpTime?.message} />
              )}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Controller
              control={control}
              name="sleepTime"
              render={({ field: { onChange, value } }) => (
                <Input label={t('onboard.sleep')} placeholder={t('onboard.sleepPlaceholder')} value={value} onChangeText={onChange} error={errors.sleepTime?.message} />
              )}
            />
          </View>
        </View>

        <Button title={isEditing ? t('common.save') : t('onboard.complete')} onPress={handleSubmit(onSubmit)} size="lg" style={{ marginTop: spacing.lg }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xxl,
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
    marginBottom: spacing.lg,
  },
});
