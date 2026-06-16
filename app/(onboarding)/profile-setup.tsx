import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { colors, spacing, fontSize, fontWeight } from '@/lib/theme';
import { useIsDark } from '@/stores/useSettingsStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTranslation } from '@/i18n';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileSetupScreen() {
  const { t } = useTranslation();
  const { user, saveUser, isOnboarded } = useAuthStore();
  const isEditing = isOnboarded;
  const schema = z.object({
    name: z.string().min(1, t('onboard.validName')),
    age: z.string().regex(/^\d+$/, t('onboard.validNumber')),
    weight: z.string().regex(/^\d+(\.\d+)?$/, t('onboard.validWeight')),
    height: z.string().regex(/^\d+(\.\d+)?$/, t('onboard.validNumber')),
  });
  type FormData = z.infer<typeof schema>;
  const isDark = useIsDark();

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name || '',
      age: user?.age ? String(user.age) : '',
      weight: user?.weight ? String(user.weight) : '',
      height: user?.height ? String(user.height) : '',
    },
  });

  const onSubmit = async (data: FormData) => {
    await saveUser({
      name: data.name,
      age: parseInt(data.age),
      weight: parseFloat(data.weight),
      height: parseFloat(data.height),
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

        <Button title={isEditing ? t('common.save') : t('onboard.continue')} onPress={handleSubmit(onSubmit)} size="lg" style={{ marginTop: spacing.lg }} />
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
