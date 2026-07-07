import { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Keyboard, Pressable } from 'react-native';
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
import { Ionicons } from '@expo/vector-icons';
import { formatTimeInput } from '@/lib/utils';

const FREQUENCIES = [
  { labelKey: 'onboard.exerciseNone', value: 0 },
  { labelKey: 'onboard.exerciseLight', value: 1 },
  { labelKey: 'onboard.exerciseModerate', value: 3 },
  { labelKey: 'onboard.exerciseActive', value: 5 },
  { labelKey: 'onboard.exerciseDaily', value: 7 },
] as const;

export default function ProfileSetupScreen() {
  const { t, locale } = useTranslation();
  const { user, saveUser, isOnboarded } = useAuthStore();
  const isEditing = isOnboarded;
  const isDark = useIsDark();

  const schema = z.object({
    name: z.string().min(1, t('onboard.validName')),
    age: z.string().regex(/^\d+$/, t('onboard.validNumber')),
    weight: z.string().regex(/^\d+(\.\d+)?$/, t('onboard.validWeight')),
    height: z.string().regex(/^\d+(\.\d+)?$/, t('onboard.validNumber')),
    exerciseFrequency: z.number().optional(),
    breakfastTime: z.string().regex(/^\d{2}:\d{2}$/, t('onboard.validTime')).optional(),
    lunchTime: z.string().regex(/^\d{2}:\d{2}$/, t('onboard.validTime')).optional(),
    dinnerTime: z.string().regex(/^\d{2}:\d{2}$/, t('onboard.validTime')).optional(),
    wakeUpTime: z.string().regex(/^\d{2}:\d{2}$/, t('onboard.validTime')).optional(),
    sleepTime: z.string().regex(/^\d{2}:\d{2}$/, t('onboard.validTime')).optional(),
    waterGoal: z.string().regex(/^\d+$/, t('onboard.validNumber')).optional(),
  });

  type FormData = z.infer<typeof schema>;

  const { control, handleSubmit, formState: { errors, isDirty }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name || '',
      age: user?.age ? String(user.age) : '',
      weight: user?.weight ? String(user.weight) : '',
      height: user?.height ? String(user.height) : '',
      exerciseFrequency: user?.exerciseFrequency ?? 0,
      breakfastTime: user?.breakfastTime || '08:00',
      lunchTime: user?.lunchTime || '12:00',
      dinnerTime: user?.dinnerTime || '19:00',
      wakeUpTime: user?.wakeUpTime || '07:00',
      sleepTime: user?.sleepTime || '23:00',
      waterGoal: user?.waterGoal ? String(user.waterGoal) : '',
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name || '',
        age: user.age ? String(user.age) : '',
        weight: user.weight ? String(user.weight) : '',
        height: user.height ? String(user.height) : '',
        exerciseFrequency: user.exerciseFrequency ?? 0,
        breakfastTime: user.breakfastTime || '08:00',
        lunchTime: user.lunchTime || '12:00',
        dinnerTime: user.dinnerTime || '19:00',
        wakeUpTime: user.wakeUpTime || '07:00',
        sleepTime: user.sleepTime || '23:00',
        waterGoal: user.waterGoal ? String(user.waterGoal) : '',
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: FormData) => {
    await saveUser({
      name: data.name,
      age: parseInt(data.age),
      weight: parseFloat(data.weight),
      height: parseFloat(data.height),
      ...(isEditing ? {
        exerciseFrequency: data.exerciseFrequency!,
        breakfastTime: data.breakfastTime!,
        lunchTime: data.lunchTime!,
        dinnerTime: data.dinnerTime!,
        wakeUpTime: data.wakeUpTime!,
        sleepTime: data.sleepTime!,
        waterGoal: parseInt(data.waterGoal!) || 0,
      } : {}),
    });
    if (isEditing) {
      router.back();
    } else {
      router.push('/(onboarding)/exercise-frequency');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        style={[
          styles.container,
          { backgroundColor: isDark ? colors.dark.background : colors.light.background },
        ]}
        contentContainerStyle={[
          styles.content,
          isEditing && { paddingTop: spacing.lg },
        ]}
      >
        <Pressable onPress={Keyboard.dismiss}>
        {isEditing ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg }}>
            <TouchableOpacity onPress={() => router.back()} style={{ position: 'absolute', left: 0, zIndex: 1 }}>
              <Ionicons name="arrow-back" size={24} color={isDark ? colors.dark.text : colors.light.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: isDark ? colors.dark.text : colors.light.text, marginBottom: 0 }]}>
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

        {isEditing && (
          <>
            {/* Exercise Frequency */}
            <Text style={[styles.sectionTitle, { color: isDark ? colors.dark.text : colors.light.text }]}>
              {t('onboard.exercise')}
            </Text>
            <Controller
              control={control}
              name="exerciseFrequency"
              render={({ field: { onChange, value } }) => (
                <View style={styles.frequencyRow}>
                  {FREQUENCIES.map((freq) => (
                    <TouchableOpacity
                      key={freq.value}
                      onPress={() => onChange(freq.value)}
                      style={[
                        styles.frequencyChip,
                        {
                          backgroundColor: value === freq.value
                            ? (isDark ? colors.dark.primaryLight : colors.light.primaryLight)
                            : (isDark ? colors.dark.surface : colors.light.surface),
                          borderColor: value === freq.value
                            ? colors.light.primary
                            : (isDark ? colors.dark.border : colors.light.border),
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.frequencyText,
                        {
                          color: value === freq.value
                            ? colors.light.primary
                            : (isDark ? colors.dark.text : colors.light.text),
                        },
                      ]}>
                        {t(freq.labelKey)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />

            {/* Meal Times */}
            <Text style={[styles.sectionTitle, { color: isDark ? colors.dark.text : colors.light.text }]}>
              {t('onboard.mealTimes')}
            </Text>

            <Controller
              control={control}
              name="breakfastTime"
              render={({ field: { onChange, value } }) => (
                <Input
                  label={t('onboard.breakfast')}
                  placeholder={t('onboard.breakfastPlaceholder')}
                  value={value}
                  onChangeText={(v) => onChange(formatTimeInput(v))}
                  keyboardType="number-pad"
                  maxLength={5}
                  error={errors.breakfastTime?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="lunchTime"
              render={({ field: { onChange, value } }) => (
                <Input
                  label={t('onboard.lunch')}
                  placeholder={t('onboard.lunchPlaceholder')}
                  value={value}
                  onChangeText={(v) => onChange(formatTimeInput(v))}
                  keyboardType="number-pad"
                  maxLength={5}
                  error={errors.lunchTime?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="dinnerTime"
              render={({ field: { onChange, value } }) => (
                <Input
                  label={t('onboard.dinner')}
                  placeholder={t('onboard.dinnerPlaceholder')}
                  value={value}
                  onChangeText={(v) => onChange(formatTimeInput(v))}
                  keyboardType="number-pad"
                  maxLength={5}
                  error={errors.dinnerTime?.message}
                />
              )}
            />

            {/* Sleep Schedule */}
            <Text style={[styles.sectionTitle, { color: isDark ? colors.dark.text : colors.light.text }]}>
              {t('onboard.sleepTitle')}
            </Text>

            <Controller
              control={control}
              name="wakeUpTime"
              render={({ field: { onChange, value } }) => (
                <Input
                  label={t('onboard.wakeUp')}
                  placeholder={t('onboard.wakeUpPlaceholder')}
                  value={value}
                  onChangeText={(v) => onChange(formatTimeInput(v))}
                  keyboardType="number-pad"
                  maxLength={5}
                  error={errors.wakeUpTime?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="sleepTime"
              render={({ field: { onChange, value } }) => (
                <Input
                  label={t('onboard.sleep')}
                  placeholder={t('onboard.sleepPlaceholder')}
                  value={value}
                  onChangeText={(v) => onChange(formatTimeInput(v))}
                  keyboardType="number-pad"
                  maxLength={5}
                  error={errors.sleepTime?.message}
                />
              )}
            />

            {/* Water Goal */}
            <Text style={[styles.sectionTitle, { color: isDark ? colors.dark.text : colors.light.text }]}>
              {t('onboard.waterGoal')}
            </Text>
            <Controller
              control={control}
              name="waterGoal"
              render={({ field: { onChange, value } }) => (
                <Input
                  value={value}
                  onChangeText={onChange}
                  keyboardType="numeric"
                  placeholder="2000"
                  style={{ textAlign: 'center', fontSize: fontSize.xl, fontWeight: fontWeight.bold }}
                  error={errors.waterGoal?.message}
                />
              )}
            />
          </>
        )}

        <Button title={isEditing ? t('common.save') : t('onboard.continue')} onPress={handleSubmit(onSubmit)} size="lg" style={{ marginTop: spacing.lg }} disabled={isEditing && !isDirty} />
        </Pressable>
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
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  frequencyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  frequencyChip: {
    width: '47%',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  frequencyText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  waterGoalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  goalUnit: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.medium,
  },
  waterGoalHint: {
    fontSize: fontSize.xs,
    textAlign: 'center',
    marginTop: -spacing.sm,
  },
});
