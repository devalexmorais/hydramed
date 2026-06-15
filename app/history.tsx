import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useIsDark } from '@/stores/useSettingsStore';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { AdBanner } from '@/components/AdBanner';
import { useInterstitialAd } from '@/lib/useInterstitialAd';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/lib/theme';
import { formatDate, formatTime } from '@/lib/utils';
import { executeQuery } from '@/db/database';
import { MedicationLog, WaterLog } from '@/types';
import { useTranslation } from '@/i18n';

export default function HistoryScreen() {
  const { t } = useTranslation();
  const isDark = useIsDark();
  const { show: showInterstitial } = useInterstitialAd();
  const [searchDate, setSearchDate] = useState(new Date().toISOString().split('T')[0]);
  const [medLogs, setMedLogs] = useState<MedicationLog[]>([]);
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [searchDate])
  );

  const loadHistory = async () => {
    const meds = await executeQuery<MedicationLog>(
      `SELECT * FROM medication_logs WHERE date(scheduledTime) = ? ORDER BY scheduledTime DESC`,
      [searchDate]
    );
    setMedLogs(meds);

    const waters = await executeQuery<WaterLog>(
      `SELECT * FROM water_logs WHERE date(createdAt) = ? ORDER BY createdAt DESC`,
      [searchDate]
    );
    setWaterLogs(waters);
  };

  const navigateDay = (delta: number) => {
    const d = new Date(searchDate);
    d.setDate(d.getDate() + delta);
    setSearchDate(d.toISOString().split('T')[0]);
  };

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: isDark ? colors.dark.background : colors.light.background },
      ]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { showInterstitial(); router.back(); }}>
          <Text style={{ color: colors.light.primary, fontSize: fontSize.md, fontWeight: fontWeight.semibold }}>
            {t('common.back')}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: isDark ? colors.dark.text : colors.light.text }]}>
          {t('history.title')}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <Card variant="elevated">
        <View style={styles.dateNav}>
          <TouchableOpacity onPress={() => navigateDay(-1)}>
            <Text style={{ fontSize: fontSize.lg, color: colors.light.primary }}>←</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: isDark ? colors.dark.text : colors.light.text }}>
            {formatDate(searchDate)}
          </Text>
          <TouchableOpacity onPress={() => navigateDay(1)}>
            <Text style={{ fontSize: fontSize.lg, color: colors.light.primary }}>→</Text>
          </TouchableOpacity>
        </View>
        <Input
          placeholder="YYYY-MM-DD"
          value={searchDate}
          onChangeText={setSearchDate}
          containerStyle={{ marginBottom: 0 }}
        />
      </Card>

      <Card variant="elevated">
        <Text style={[styles.sectionTitle, { color: isDark ? colors.dark.text : colors.light.text }]}>
          💊 {t('history.medications')}
        </Text>
        {medLogs.length === 0 ? (
          <Text style={{ color: isDark ? colors.dark.textTertiary : colors.light.textTertiary, fontSize: fontSize.sm }}>
            {t('history.noMeds')}
          </Text>
        ) : (
          medLogs.map((log) => (
            <View key={log.id} style={[styles.logRow, { borderBottomColor: isDark ? colors.dark.border : colors.light.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: isDark ? colors.dark.text : colors.light.text, fontSize: fontSize.sm, fontWeight: fontWeight.medium }}>
                  {log.medicationName}
                </Text>
                <Text style={{ color: isDark ? colors.dark.textSecondary : colors.light.textSecondary, fontSize: fontSize.xs }}>
                  {log.dosage}{log.unit}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        log.status === 'taken' ? colors.light.success + '20' :
                        log.status === 'skipped' ? colors.light.warning + '20' :
                        colors.light.surfaceSecondary,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: fontSize.xs,
                      fontWeight: fontWeight.semibold,
                      color: log.status === 'taken' ? colors.light.success :
                             log.status === 'skipped' ? colors.light.warning :
                             isDark ? colors.dark.textSecondary : colors.light.textSecondary,
                      textTransform: 'capitalize',
                    }}
                  >
                    {log.status}
                  </Text>
                </View>
                <Text style={{ color: isDark ? colors.dark.textTertiary : colors.light.textTertiary, fontSize: fontSize.xs, marginTop: 2 }}>
                  {log.completedAt ? new Date(log.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </Text>
              </View>
            </View>
          ))
        )}
      </Card>

      <Card variant="elevated">
        <Text style={[styles.sectionTitle, { color: isDark ? colors.dark.text : colors.light.text }]}>
          💧 {t('history.water')}
        </Text>
        {waterLogs.length === 0 ? (
          <Text style={{ color: isDark ? colors.dark.textTertiary : colors.light.textTertiary, fontSize: fontSize.sm }}>
            {t('history.noWater')}
          </Text>
        ) : (
          <>
            <Text style={{ fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.light.secondary, marginBottom: spacing.sm }}>
              {t('history.total', { total: waterLogs.reduce((s, l) => s + l.amount, 0) })}
            </Text>
            {waterLogs.map((log) => (
              <View key={log.id} style={[styles.logRow, { borderBottomColor: isDark ? colors.dark.border : colors.light.border }]}>
                <Text style={{ color: isDark ? colors.dark.text : colors.light.text, fontSize: fontSize.sm }}>
                  {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Text style={{ color: colors.light.secondary, fontWeight: fontWeight.semibold, fontSize: fontSize.sm }}>
                  +{log.amount}ml
                </Text>
              </View>
            ))}
          </>
        )}
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
  dateNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, marginBottom: spacing.sm },
  logRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1 },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 4 },
});
