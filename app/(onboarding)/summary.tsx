import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Keyboard, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProgressCircle } from '@/components/ProgressCircle';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/lib/theme';
import { useIsDark } from '@/stores/useSettingsStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTranslation } from '@/i18n';
import { scheduleAllHydrationReminders } from '@/lib/notifications';

export default function SummaryScreen() {
  const { t, locale } = useTranslation();
  const { user, saveUser, completeOnboarding } = useAuthStore();
  const isDark = useIsDark();
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [progress, setProgress] = useState(0);

  const w = Math.max(user?.weight || 0, 0);
  const h = Math.max(user?.height || 0, 0);
  const calculatedGoal = w > 0 && h > 0
    ? Math.round((w * 33 + h * 0.4) / 100) * 100
    : w > 0
      ? Math.round(w * 33 / 100) * 100
      : 2000;
  const safeGoal = Number.isFinite(calculatedGoal) ? calculatedGoal : 2000;

  const [waterGoal, setWaterGoal] = useState(String(safeGoal));

  useEffect(() => {
    progressAnim.addListener(({ value }) => setProgress(value));
    Animated.timing(progressAnim, {
      toValue: 100,
      duration: 2000,
      useNativeDriver: false,
    }).start(() => {
      progressAnim.removeAllListeners();
      setCalculating(false);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    });
    return () => progressAnim.removeAllListeners();
  }, []);

  const handleStart = async () => {
    setSaving(true);
    const goal = parseInt(waterGoal) || safeGoal;
    await saveUser({ waterGoal: goal });
    await scheduleAllHydrationReminders(
      goal,
      user?.wakeUpTime || '07:00',
      user?.sleepTime || '23:00',
      user?.locale || 'en'
    );
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  const suggestionText = locale.startsWith('pt')
    ? `Sugestão com base em suas informações`
    : locale.startsWith('es')
      ? `Sugerencia basada en tu información`
      : `Suggested based on your information`;

  if (calculating) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: isDark ? colors.dark.background : colors.light.background }]}>
        <ProgressCircle
          progress={progress}
          size={180}
          strokeWidth={14}
          color={colors.light.primary}
        >
          <Text style={styles.waterDrop}>💧</Text>
        </ProgressCircle>
        <Text style={[styles.title, { color: isDark ? colors.dark.text : colors.light.text }]}>
          {t('onboard.summaryTitle')}
        </Text>
        <Text style={[styles.subtitle, { color: isDark ? colors.dark.textSecondary : colors.light.textSecondary }]}>
          {t('onboard.summaryDesc')}
        </Text>
      </View>
    );
  }

  return (
    <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss}>
    <View style={[styles.container, { backgroundColor: isDark ? colors.dark.background : colors.light.background }]}>
      <View style={styles.content}>
        <Animated.View style={[styles.resultContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <View style={[styles.waterIconWrap, { shadowColor: colors.light.primary }]}>
            <Text style={styles.waterIcon}>💧</Text>
          </View>

          <Text style={[styles.resultLabel, { color: isDark ? colors.dark.text : colors.light.text }]}>
            {t('onboard.waterGoal')}
          </Text>

          <View style={[styles.goalCard, { backgroundColor: isDark ? colors.dark.surface : colors.light.surface, borderColor: isDark ? colors.dark.border : colors.light.border, shadowColor: isDark ? colors.dark.cardShadow : colors.light.cardShadow }]}>
            <View style={styles.goalInputRow}>
              <Input
                value={waterGoal}
                onChangeText={setWaterGoal}
                keyboardType="numeric"
                containerStyle={{ marginBottom: 0, width: 140 }}
                style={{ textAlign: 'center', fontSize: fontSize.xxl + 4, fontWeight: fontWeight.bold }}
              />
              <Text style={[styles.goalUnit, { color: isDark ? colors.dark.textSecondary : colors.light.textSecondary }]}>ml</Text>
            </View>

            <View style={[styles.suggestionBadge, { backgroundColor: isDark ? colors.dark.primaryLight : colors.light.primaryLight }]}>
              <Text style={styles.suggestionIcon}>✨</Text>
              <Text style={[styles.suggestion, { color: colors.light.primary }]}>
                {suggestionText}
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, width: '100%' }}>
          <Button
            title={t('onboard.start')}
            onPress={handleStart}
            size="lg"
            loading={saving}
            style={{ width: '100%' }}
          />
        </Animated.View>
      </View>
    </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center', padding: spacing.lg, gap: spacing.lg },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg, gap: spacing.xl },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, textAlign: 'center' },
  subtitle: { fontSize: fontSize.md, textAlign: 'center', lineHeight: 24, paddingHorizontal: spacing.md },
  waterDrop: { fontSize: 48 },
  resultContainer: { alignItems: 'center', gap: spacing.lg },
  resultLabel: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, textAlign: 'center' },
  waterIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.light.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  waterIcon: { fontSize: 48 },
  goalCard: {
    width: '100%',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  goalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  goalUnit: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.medium,
  },
  suggestionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
  },
  suggestionIcon: { fontSize: 12 },
  suggestion: { fontSize: fontSize.xs, textAlign: 'center' },
});
