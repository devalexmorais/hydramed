import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState, useMemo } from 'react';
import { useIsDark } from '@/stores/useSettingsStore';
import { Card } from '@/components/ui/Card';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/lib/theme';
import { getMonthDays } from '@/lib/utils';
import { executeQuery } from '@/db/database';

import { useTranslation } from '@/i18n';

interface MedLogRow {
  day: string;
  status: string;
}

interface WaterLogRow {
  day: string;
  total: number;
}

export default function CalendarScreen() {
  const isDark = useIsDark();
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [medicationData, setMedicationData] = useState<Record<string, string>>({});
  const [waterData, setWaterData] = useState<Record<string, number>>({});

  const days = useMemo(() => getMonthDays(currentYear, currentMonth), [currentYear, currentMonth]);

  useFocusEffect(
    useCallback(() => {
      loadMonthData();
    }, [currentMonth, currentYear])
  );

  const loadMonthData = async () => {
    const start = days[0];
    const end = days[days.length - 1];

    const medLogs = await executeQuery<MedLogRow>(
      `SELECT date(scheduledTime) as day, status FROM medication_logs
       WHERE date(scheduledTime) >= ? AND date(scheduledTime) <= ?`,
      [start, end]
    );

    const waterLogs = await executeQuery<WaterLogRow>(
      `SELECT date(createdAt) as day, COALESCE(SUM(amount), 0) as total FROM water_logs
       WHERE date(createdAt) >= ? AND date(createdAt) <= ? GROUP BY date(createdAt)`,
      [start, end]
    );

    const medMap: Record<string, string> = {};
    for (const log of medLogs) {
      const day = log.day;
      if (log.status === 'skipped') {
        medMap[day] = 'missed';
      } else if (log.status === 'taken' && medMap[day] !== 'missed') {
        medMap[day] = 'completed';
      } else if (log.status === 'pending' && !medMap[day]) {
        medMap[day] = 'partial';
      }
    }

    const waterMap: Record<string, number> = {};
    for (const w of waterLogs) {
      waterMap[w.day] = w.total;
    }

    setMedicationData(medMap);
    setWaterData(waterMap);
  };

  const navigateMonth = (delta: number) => {
    let m = currentMonth + delta;
    let y = currentYear;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setCurrentMonth(m);
    setCurrentYear(y);
  };

  const getDayStatusColor = (date: string) => {
    const status = medicationData[date];
    if (status === 'completed') return colors.light.success;
    if (status === 'partial') return colors.light.warning;
    if (status === 'missed') return colors.light.danger;
    return 'transparent';
  };

  const { t, locale } = useTranslation();
  const weekdays = [t('calendar.mon'), t('calendar.tue'), t('calendar.wed'), t('calendar.thu'), t('calendar.fri'), t('calendar.sat'), t('calendar.sun')];
  const today = new Date().toISOString().split('T')[0];
  const monthName = new Date(currentYear, currentMonth - 1).toLocaleString(locale === 'en' ? 'en-US' : locale === 'pt-BR' ? 'pt-BR' : 'es-ES', { month: 'long' });

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
        {t('calendar.title')}
      </Text>

      <Card variant="elevated">
        <View style={styles.monthHeader}>
          <Text
            style={{ fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.light.primary }}
            onPress={() => navigateMonth(-1)}
          >
            ←
          </Text>
          <Text style={{ fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: isDark ? colors.dark.text : colors.light.text }}>
            {monthName} {currentYear}
          </Text>
          <Text
            style={{ fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.light.primary }}
            onPress={() => navigateMonth(1)}
          >
            →
          </Text>
        </View>

        <View style={styles.weekdayRow}>
          {weekdays.map((day) => (
            <View key={day} style={styles.weekdayCell}>
              <Text style={{ fontSize: fontSize.xs, color: isDark ? colors.dark.textTertiary : colors.light.textTertiary }}>
                {day}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {days.map((date) => {
            const d = new Date(date);
            const dayOfWeek = d.getDay();
            const isToday = date === today;
            const statusColor = getDayStatusColor(date);
            const waterTotal = waterData[date] || 0;

            return (
              <View key={date} style={[styles.dayCell, dayOfWeek === 0 && { opacity: 0.4 }]}>
                <View
                  style={[
                    styles.dayNumber,
                    isToday && {
                      backgroundColor: colors.light.primary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
                      isToday ? { color: '#FFFFFF' } : { color: isDark ? colors.dark.text : colors.light.text },
                    ]}
                  >
                    {d.getDate()}
                  </Text>
                </View>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                {waterTotal > 0 && (
                  <Text style={{ fontSize: fontSize.xxs, color: colors.light.secondary, marginTop: 1 }}>
                    💧
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      </Card>

      <Card variant="elevated">
        <Text style={{ fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: isDark ? colors.dark.text : colors.light.text, marginBottom: spacing.md }}>
          {t('calendar.legend')}
        </Text>
        <View style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.light.success }} />
            <Text style={{ color: isDark ? colors.dark.textSecondary : colors.light.textSecondary, fontSize: fontSize.sm }}>
              {t('calendar.allTaken')}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.light.warning }} />
            <Text style={{ color: isDark ? colors.dark.textSecondary : colors.light.textSecondary, fontSize: fontSize.sm }}>
              {t('calendar.partial')}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.light.danger }} />
            <Text style={{ color: isDark ? colors.dark.textSecondary : colors.light.textSecondary, fontSize: fontSize.sm }}>
              {t('calendar.missed')}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Text style={{ fontSize: fontSize.xs }}>💧</Text>
            <Text style={{ color: isDark ? colors.dark.textSecondary : colors.light.textSecondary, fontSize: fontSize.sm }}>
              {t('calendar.waterLogged')}
            </Text>
          </View>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, marginBottom: spacing.sm },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  dayNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
});
