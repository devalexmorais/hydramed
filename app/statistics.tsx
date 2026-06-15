import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useIsDark } from '@/stores/useSettingsStore';
import { useStatsStore } from '@/stores/useStatsStore';
import { Card } from '@/components/ui/Card';
import { ProgressCircle } from '@/components/ProgressCircle';
import { AdBanner } from '@/components/AdBanner';
import { useInterstitialAd } from '@/lib/useInterstitialAd';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/lib/theme';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { useTranslation } from '@/i18n';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - spacing.lg * 2 - spacing.md * 2;
const CHART_HEIGHT = 180;

export default function StatisticsScreen() {
  const isDark = useIsDark();
  const { show: showInterstitial } = useInterstitialAd();
  const { dailyStats, weeklyStats, loadDailyStats, loadWeeklyStats, loadMonthlyAdherence } = useStatsStore();
  const [monthlyAdherence, setMonthlyAdherence] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadDailyStats();
      loadWeeklyStats();
      loadMonthlyAdherence().then(setMonthlyAdherence);
    }, [])
  );

  const { t, locale } = useTranslation();
  const barWidth = weeklyStats?.days.length ? Math.max((CHART_WIDTH - 40) / weeklyStats.days.length - 8, 12) : 20;

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: isDark ? colors.dark.background : colors.light.background },
      ]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text
          style={{ color: colors.light.primary, fontSize: fontSize.md, fontWeight: fontWeight.semibold }}
          onPress={() => { showInterstitial(); router.back(); }}
        >
          {t('common.back')}
        </Text>
        <Text style={[styles.title, { color: isDark ? colors.dark.text : colors.light.text }]}>
          {t('stats.title')}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.circleRow}>
        <Card variant="elevated" style={styles.circleCard}>
          <Text style={{ fontSize: fontSize.sm, color: isDark ? colors.dark.textSecondary : colors.light.textSecondary, marginBottom: spacing.sm, textAlign: 'center' }}>
            {t('stats.today')}
          </Text>
          <ProgressCircle
            progress={dailyStats?.adherencePercent || 0}
            size={80}
            strokeWidth={6}
            color={colors.light.success}
            label={`${dailyStats?.adherencePercent || 0}%`}
          />
          <Text style={{ fontSize: fontSize.xs, color: isDark ? colors.dark.textTertiary : colors.light.textTertiary, textAlign: 'center', marginTop: spacing.sm }}>
            {t('stats.dosesCount', { taken: dailyStats?.takenDoses || 0, total: dailyStats?.totalDoses || 0 })}
          </Text>
        </Card>

        <Card variant="elevated" style={styles.circleCard}>
          <Text style={{ fontSize: fontSize.sm, color: isDark ? colors.dark.textSecondary : colors.light.textSecondary, marginBottom: spacing.sm, textAlign: 'center' }}>
            {t('stats.week')}
          </Text>
          <ProgressCircle
            progress={weeklyStats?.averageAdherence || 0}
            size={80}
            strokeWidth={6}
            color={colors.light.primary}
            label={`${weeklyStats?.averageAdherence || 0}%`}
          />
          <Text style={{ fontSize: fontSize.xs, color: isDark ? colors.dark.textTertiary : colors.light.textTertiary, textAlign: 'center', marginTop: spacing.sm }}>
            {t('stats.avgAdherence')}
          </Text>
        </Card>

        <Card variant="elevated" style={styles.circleCard}>
          <Text style={{ fontSize: fontSize.sm, color: isDark ? colors.dark.textSecondary : colors.light.textSecondary, marginBottom: spacing.sm, textAlign: 'center' }}>
            {t('stats.month')}
          </Text>
          <ProgressCircle
            progress={monthlyAdherence}
            size={80}
            strokeWidth={6}
            color={colors.light.secondary}
            label={`${monthlyAdherence}%`}
          />
          <Text style={{ fontSize: fontSize.xs, color: isDark ? colors.dark.textTertiary : colors.light.textTertiary, textAlign: 'center', marginTop: spacing.sm }}>
            {t('stats.overall')}
          </Text>
        </Card>
      </View>

      <Card variant="elevated">
        <Text style={[styles.chartTitle, { color: isDark ? colors.dark.text : colors.light.text }]}>
          {t('stats.weeklyAdherence')}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Svg width={Math.max(CHART_WIDTH, (weeklyStats?.days.length || 7) * 50)} height={CHART_HEIGHT}>
            {weeklyStats?.days.map((day, i) => {
              const x = i * 50 + 20;
              const barH = (day.adherencePercent / 100) * (CHART_HEIGHT - 50);
              return (
                <Rect
                  key={day.date}
                  x={x}
                  y={CHART_HEIGHT - 30 - barH}
                  width={barWidth}
                  height={barH}
                  rx={4}
                  fill={day.adherencePercent >= 80 ? colors.light.success : day.adherencePercent >= 50 ? colors.light.warning : colors.light.danger}
                />
              );
            })}
          </Svg>
        </ScrollView>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing.sm }}>
          {weeklyStats?.days.map((day) => (
            <Text key={day.date} style={{ fontSize: fontSize.xxs, color: isDark ? colors.dark.textTertiary : colors.light.textTertiary, width: 36, textAlign: 'center' }}>
              {new Date(day.date + 'T00:00:00').toLocaleDateString(locale === 'en' ? 'en-US' : locale === 'pt-BR' ? 'pt-BR' : 'es-ES', { weekday: 'short' })}
            </Text>
          ))}
        </View>
      </Card>

      <Card variant="elevated">
        <Text style={[styles.chartTitle, { color: isDark ? colors.dark.text : colors.light.text }]}>
          {t('stats.waterIntake')}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Svg width={Math.max(CHART_WIDTH, (weeklyStats?.days.length || 7) * 50)} height={CHART_HEIGHT}>
            {weeklyStats?.days.map((day, i) => {
              const x = i * 50 + 20;
              const barH = (day.waterIntake / Math.max(day.waterGoal, 1)) * (CHART_HEIGHT - 50);
              const displayH = Math.min(barH, CHART_HEIGHT - 50);
              return (
                <Rect
                  key={day.date}
                  x={x}
                  y={CHART_HEIGHT - 30 - displayH}
                  width={barWidth}
                  height={Math.max(displayH, 0)}
                  rx={4}
                  fill={colors.light.secondary}
                />
              );
            })}
          </Svg>
        </ScrollView>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing.sm }}>
          {weeklyStats?.days.map((day) => (
            <Text key={day.date} style={{ fontSize: fontSize.xxs, color: isDark ? colors.dark.textTertiary : colors.light.textTertiary, width: 36, textAlign: 'center' }}>
              {new Date(day.date + 'T00:00:00').toLocaleDateString(locale === 'en' ? 'en-US' : locale === 'pt-BR' ? 'pt-BR' : 'es-ES', { weekday: 'short' })}
            </Text>
          ))}
        </View>
      </Card>

      <Card variant="elevated">
        <Text style={[styles.chartTitle, { color: isDark ? colors.dark.text : colors.light.text }]}>
          {t('stats.summary')}
        </Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={{ fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.light.success }}>
              {dailyStats?.takenDoses || 0}
            </Text>
            <Text style={{ fontSize: fontSize.xs, color: isDark ? colors.dark.textSecondary : colors.light.textSecondary }}>{t('stats.taken')}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={{ fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.light.danger }}>
              {dailyStats?.missedDoses || 0}
            </Text>
            <Text style={{ fontSize: fontSize.xs, color: isDark ? colors.dark.textSecondary : colors.light.textSecondary }}>{t('stats.missed')}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={{ fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.light.warning }}>
              {dailyStats?.totalDoses || 0}
            </Text>
            <Text style={{ fontSize: fontSize.xs, color: isDark ? colors.dark.textSecondary : colors.light.textSecondary }}>{t('stats.total')}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={{ fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.light.secondary }}>
              {dailyStats?.waterIntake || 0}ml
            </Text>
            <Text style={{ fontSize: fontSize.xs, color: isDark ? colors.dark.textSecondary : colors.light.textSecondary }}>{t('stats.water')}</Text>
          </View>
        </View>
      </Card>
      <AdBanner />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  circleRow: { flexDirection: 'row', gap: spacing.sm },
  circleCard: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  chartTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, marginBottom: spacing.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
});
