import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/lib/theme';
import { useSettingsStore, useIsDark } from '@/stores/useSettingsStore';
import { requestNotificationPermissions } from '@/lib/notifications';
import { useTranslation } from '@/i18n';

export default function PermissionsScreen() {
  const isDark = useIsDark();
  const { t } = useTranslation();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? colors.dark.background : colors.light.background },
      ]}
    >
      <View style={styles.content}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: isDark ? colors.dark.surfaceSecondary : colors.light.primaryLight },
          ]}
        >
          <Text style={styles.icon}>🔔</Text>
        </View>

        <Text
          style={[
            styles.title,
            { color: isDark ? colors.dark.text : colors.light.text },
          ]}
        >
          {t('onboard.permissions')}
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: isDark ? colors.dark.textSecondary : colors.light.textSecondary },
          ]}
        >
          {t('onboard.permissionsDesc')}
        </Text>

        <View style={styles.benefits}>
          {[
            t('onboard.perk1'),
            t('onboard.perk2'),
            t('onboard.perk3'),
          ].map((benefit, i) => (
            <View key={i} style={styles.benefitRow}>
              <Text style={styles.checkmark}>✓</Text>
              <Text
                style={{
                  color: isDark ? colors.dark.text : colors.light.text,
                  fontSize: fontSize.sm,
                }}
              >
                {benefit}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          title={t('onboard.enableNotifs')}
          onPress={async () => {
            const locale = useSettingsStore.getState().locale;
            const granted = await requestNotificationPermissions(locale);
            if (!granted) {
              useSettingsStore.getState().setNotificationsEnabled(false);
            }
            router.push('/(onboarding)/profile-setup');
          }}
          size="lg"
          style={{ width: '100%' }}
        />
        <Button
          title={t('onboard.skip')}
          onPress={() => router.push('/(onboarding)/profile-setup')}
          variant="ghost"
          size="lg"
          style={{ width: '100%', marginTop: spacing.sm }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.md,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  benefits: {
    width: '100%',
    gap: spacing.md,
    padding: spacing.lg,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkmark: {
    color: colors.light.success,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  footer: {
    paddingBottom: spacing.xxl,
    paddingTop: spacing.md,
  },
});
