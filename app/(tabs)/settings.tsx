import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore, useIsDark } from '@/stores/useSettingsStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/i18n';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/lib/theme';
import { ThemeMode } from '@/types';
import { cancelAllNotifications } from '@/lib/notifications';

export default function SettingsScreen() {
  const { user, resetUser, saveLocale, saveTheme } = useAuthStore();
  const { theme, setTheme, locale, setLocale } = useSettingsStore();
  const isDark = useIsDark();
  const { t } = useTranslation();
  const handleExport = async () => {
    Alert.alert(t('common.export'), t('settings.exportComing'));
  };

  const handleReset = () => {
    Alert.alert(
      t('common.reset'),
      t('settings.resetConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.reset'),
          style: 'destructive',
          onPress: async () => {
            await resetUser();
            await cancelAllNotifications();
            router.replace('/(onboarding)/welcome');
          },
        },
      ]
    );
  };

  const themeOptions: { label: string; value: ThemeMode }[] = [
    { label: t('settings.light'), value: 'light' },
    { label: t('settings.dark'), value: 'dark' },
    { label: t('settings.system'), value: 'system' },
  ];

  const languageOptions = [
    { label: 'English', value: 'en' },
    { label: 'Português', value: 'pt-BR' },
    { label: 'Español', value: 'es' },
  ];

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: isDark ? colors.dark.background : colors.light.background },
      ]}
      contentContainerStyle={styles.content}
    >
      <Text
        style={[styles.title, { color: isDark ? colors.dark.text : colors.light.text }]}
      >
        {t('settings.title')}
      </Text>

      {/* Profile */}
      <Card variant="elevated">
        <View style={styles.sectionHeader}>
          <Text style={{ fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: isDark ? colors.dark.text : colors.light.text }}>
            👤 {t('settings.profile')}
          </Text>
        </View>
        <View style={styles.profileRow}>
          <View
            style={[
              styles.profileAvatar,
              { backgroundColor: colors.light.primaryLight },
            ]}
          >
            <Text style={styles.profileAvatarText}>
              {(user?.name || 'U')[0].toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: isDark ? colors.dark.text : colors.light.text }}>
              {user?.name || t('settings.notSet')}
            </Text>
            <Text style={{ fontSize: fontSize.sm, color: isDark ? colors.dark.textSecondary : colors.light.textSecondary }}>
              {user?.age ? t('settings.profileSubtitle', { age: user.age, weight: user.weight || 0 }) : t('settings.profileIncomplete')}
            </Text>
          </View>
        </View>
        <View style={styles.profileDetails}>
          <View style={styles.detailRow}>
            <Text style={{ color: isDark ? colors.dark.textSecondary : colors.light.textSecondary, fontSize: fontSize.sm }}>{t('settings.waterGoal')}</Text>
            <Text style={{ color: isDark ? colors.dark.text : colors.light.text, fontWeight: fontWeight.semibold, fontSize: fontSize.sm }}>
              {user?.waterGoal || 2000}ml
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={{ color: isDark ? colors.dark.textSecondary : colors.light.textSecondary, fontSize: fontSize.sm }}>{t('settings.wakeUp')}</Text>
            <Text style={{ color: isDark ? colors.dark.text : colors.light.text, fontWeight: fontWeight.semibold, fontSize: fontSize.sm }}>
              {user?.wakeUpTime || '07:00'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={{ color: isDark ? colors.dark.textSecondary : colors.light.textSecondary, fontSize: fontSize.sm }}>{t('settings.sleep')}</Text>
            <Text style={{ color: isDark ? colors.dark.text : colors.light.text, fontWeight: fontWeight.semibold, fontSize: fontSize.sm }}>
              {user?.sleepTime || '23:00'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={{ color: isDark ? colors.dark.textSecondary : colors.light.textSecondary, fontSize: fontSize.sm }}>{t('onboard.height')}</Text>
            <Text style={{ color: isDark ? colors.dark.text : colors.light.text, fontWeight: fontWeight.semibold, fontSize: fontSize.sm }}>
              {user?.height ? `${user.height}cm` : '--'}
            </Text>
          </View>
        </View>
        <Button
          title={t('settings.editProfile')}
          variant="outline"
          onPress={() => router.push('/(onboarding)/profile-setup')}
          style={{ marginTop: spacing.sm }}
        />
      </Card>

      {/* Theme */}
      <Card variant="elevated">
        <View style={styles.sectionHeader}>
          <Text style={{ fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: isDark ? colors.dark.text : colors.light.text }}>
            🎨 {t('settings.theme')}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {themeOptions.map((option) => (
            <Button
              key={option.value}
              title={option.label}
              onPress={() => saveTheme(option.value)}
              variant={theme === option.value ? 'primary' : 'outline'}
              size="sm"
              style={{ flex: 1 }}
            />
          ))}
        </View>
      </Card>

      {/* Language */}
      <Card variant="elevated">
        <View style={styles.sectionHeader}>
          <Text style={{ fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: isDark ? colors.dark.text : colors.light.text }}>
            🌐 {t('settings.language')}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {languageOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              onPress={async () => {
                setLocale(option.value);
                await saveLocale(option.value);
              }}
              style={[
                {
                  flex: 1,
                  paddingVertical: spacing.sm,
                  borderRadius: borderRadius.md,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: locale === option.value ? colors.light.primary : isDark ? colors.dark.border : colors.light.border,
                  backgroundColor: locale === option.value
                    ? (isDark ? colors.dark.primaryLight : colors.light.primaryLight)
                    : 'transparent',
                },
              ]}
              activeOpacity={0.7}
            >
              <Text style={{
                fontSize: fontSize.sm,
                fontWeight: fontWeight.semibold,
                color: locale === option.value ? colors.light.primary : isDark ? colors.dark.text : colors.light.text,
              }}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Data */}
      <Card variant="elevated">
        <Text style={{ fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: isDark ? colors.dark.text : colors.light.text, marginBottom: spacing.md }}>
          📊 {t('settings.data')}
        </Text>
        <View style={{ gap: spacing.sm }}>
          <Button title={t('settings.exportData')} variant="outline" onPress={handleExport} />
          <Button title={t('settings.resetAll')} variant="outline" onPress={handleReset} textStyle={{ color: colors.light.danger }} />
        </View>
      </Card>

      {/* Version */}
      <Card variant="elevated">
        <Text style={{ fontSize: fontSize.sm, color: isDark ? colors.dark.textTertiary : colors.light.textTertiary, textAlign: 'center' }}>
          {t('settings.version')}
        </Text>
      </Card>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, marginBottom: spacing.sm },
  sectionHeader: { marginBottom: spacing.md },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  profileAvatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  profileAvatarText: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.light.primary },
  profileDetails: { gap: spacing.sm, marginBottom: spacing.sm },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
