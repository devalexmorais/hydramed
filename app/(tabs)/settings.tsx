import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore, useIsDark } from '@/stores/useSettingsStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/i18n';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/lib/theme';
import { ThemeMode } from '@/types';


export default function SettingsScreen() {
  const { user, saveLocale, saveTheme } = useAuthStore();
  const { theme, setTheme, locale, setLocale } = useSettingsStore();
  const isDark = useIsDark();
  const { t } = useTranslation();
  const [themeModal, setThemeModal] = useState(false);
  const [langModal, setLangModal] = useState(false);
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
          <View style={styles.detailRow}>
            <Text style={{ color: isDark ? colors.dark.textSecondary : colors.light.textSecondary, fontSize: fontSize.sm }}>{t('onboard.exerciseLabel')}</Text>
            <Text style={{ color: isDark ? colors.dark.text : colors.light.text, fontWeight: fontWeight.semibold, fontSize: fontSize.sm }}>
              {t('onboard.exerciseDays', { days: user?.exerciseFrequency ?? 0 })}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={{ color: isDark ? colors.dark.textSecondary : colors.light.textSecondary, fontSize: fontSize.sm }}>{t('onboard.mealTimesLabel')}</Text>
            <Text style={{ color: isDark ? colors.dark.text : colors.light.text, fontWeight: fontWeight.semibold, fontSize: fontSize.sm }}>
              {t('onboard.mealSchedule', {
                breakfast: user?.breakfastTime || '08:00',
                lunch: user?.lunchTime || '12:00',
                dinner: user?.dinnerTime || '19:00',
              })}
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
      <TouchableOpacity activeOpacity={0.7} onPress={() => setThemeModal(true)}>
        <Card variant="elevated">
          <View style={styles.selectRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Text style={{ fontSize: fontSize.lg }}>🎨</Text>
              <View>
                <Text style={{ fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: isDark ? colors.dark.text : colors.light.text }}>
                  {t('settings.theme')}
                </Text>
                <Text style={{ fontSize: fontSize.sm, color: isDark ? colors.dark.textSecondary : colors.light.textSecondary }}>
                  {themeOptions.find(o => o.value === theme)?.label}
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: fontSize.sm, color: isDark ? colors.dark.textTertiary : colors.light.textTertiary }}>
              ›
            </Text>
          </View>
        </Card>
      </TouchableOpacity>

      {/* Language */}
      <TouchableOpacity activeOpacity={0.7} onPress={() => setLangModal(true)}>
        <Card variant="elevated">
          <View style={styles.selectRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Text style={{ fontSize: fontSize.lg }}>🌐</Text>
              <View>
                <Text style={{ fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: isDark ? colors.dark.text : colors.light.text }}>
                  {t('settings.language')}
                </Text>
                <Text style={{ fontSize: fontSize.sm, color: isDark ? colors.dark.textSecondary : colors.light.textSecondary }}>
                  {languageOptions.find(o => o.value === locale)?.label}
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: fontSize.sm, color: isDark ? colors.dark.textTertiary : colors.light.textTertiary }}>
              ›
            </Text>
          </View>
        </Card>
      </TouchableOpacity>

      {/* Theme Modal */}
      <Modal visible={themeModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setThemeModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? colors.dark.surface : colors.light.surface, borderColor: isDark ? colors.dark.border : colors.light.border }]}>
            <Text style={[styles.modalTitle, { color: isDark ? colors.dark.text : colors.light.text }]}>
              🎨 {t('settings.theme')}
            </Text>
            {themeOptions.map((option) => {
              const selected = theme === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.modalOption, { backgroundColor: selected ? (isDark ? colors.dark.primaryLight : colors.light.primaryLight) : 'transparent', borderColor: selected ? colors.light.primary : (isDark ? colors.dark.border : colors.light.border) }]}
                  onPress={() => { saveTheme(option.value); setThemeModal(false); }}
                >
                  <View style={[styles.radio, { borderColor: selected ? colors.light.primary : (isDark ? colors.dark.textTertiary : colors.light.textTertiary), backgroundColor: selected ? colors.light.primary : 'transparent' }]}>
                    {selected && <View style={styles.radioInner} />}
                  </View>
                  <Text style={{ fontSize: fontSize.md, color: isDark ? colors.dark.text : colors.light.text, fontWeight: selected ? fontWeight.semibold : fontWeight.regular }}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity style={styles.modalClose} onPress={() => setThemeModal(false)}>
              <Text style={{ fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: isDark ? colors.dark.textSecondary : colors.light.textSecondary }}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Language Modal */}
      <Modal visible={langModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setLangModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? colors.dark.surface : colors.light.surface, borderColor: isDark ? colors.dark.border : colors.light.border }]}>
            <Text style={[styles.modalTitle, { color: isDark ? colors.dark.text : colors.light.text }]}>
              🌐 {t('settings.language')}
            </Text>
            {languageOptions.map((option) => {
              const selected = locale === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.modalOption, { backgroundColor: selected ? (isDark ? colors.dark.primaryLight : colors.light.primaryLight) : 'transparent', borderColor: selected ? colors.light.primary : (isDark ? colors.dark.border : colors.light.border) }]}
                  onPress={async () => { setLocale(option.value); await saveLocale(option.value); setLangModal(false); }}
                >
                  <View style={[styles.radio, { borderColor: selected ? colors.light.primary : (isDark ? colors.dark.textTertiary : colors.light.textTertiary), backgroundColor: selected ? colors.light.primary : 'transparent' }]}>
                    {selected && <View style={styles.radioInner} />}
                  </View>
                  <Text style={{ fontSize: fontSize.md, color: isDark ? colors.dark.text : colors.light.text, fontWeight: selected ? fontWeight.semibold : fontWeight.regular }}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity style={styles.modalClose} onPress={() => setLangModal(false)}>
              <Text style={{ fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: isDark ? colors.dark.textSecondary : colors.light.textSecondary }}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

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
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    borderWidth: 1,
    borderBottomWidth: 0,
    gap: spacing.sm,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  modalClose: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
});
