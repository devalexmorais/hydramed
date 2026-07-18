import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useMedicationStore } from '@/stores/useMedicationStore';
import { useIsDark } from '@/stores/useSettingsStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AdBanner } from '@/components/AdBanner';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/lib/theme';
import { formatTime, formatDate } from '@/lib/utils';
import { Medication, MedicationLog } from '@/types';
import { executeQuery } from '@/db/database';
import { useTranslation, translateUnit } from '@/i18n';

export default function MedicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { medications, deleteMedication, logStatus } = useMedicationStore();
  const isDark = useIsDark();
  const [recentLogs, setRecentLogs] = useState<MedicationLog[]>([]);

  const handleBack = () => {
    router.back();
  };

  const { t, locale } = useTranslation();
  const med = medications.find((m) => m.id === parseInt(id));

  useFocusEffect(
    useCallback(() => {
      loadRecentLogs();
    }, [id])
  );

  const loadRecentLogs = async () => {
    const logs = await executeQuery<MedicationLog>(
      `SELECT * FROM medication_logs WHERE medicationId = ? ORDER BY scheduledTime DESC LIMIT 20`,
      [parseInt(id)]
    );
    setRecentLogs(logs);
  };

  const handleDelete = () => {
    Alert.alert(
      t('medDetail.deleteTitle'),
      t('medDetail.deleteMsg'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('medDetail.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteMedication(parseInt(id));
            router.back();
          },
        },
      ]
    );
  };

  if (!med) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? colors.dark.background : colors.light.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: isDark ? colors.dark.textSecondary : colors.light.textSecondary }}>{t('medDetail.notFound')}</Text>
        <Button title={t('medDetail.goBack')} onPress={() => router.back()} style={{ marginTop: spacing.md }} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: isDark ? colors.dark.background : colors.light.background },
      ]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={{ color: colors.light.primary, fontSize: fontSize.md, fontWeight: fontWeight.semibold }}>{t('common.back')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete}>
          <Text style={{ color: colors.light.danger, fontSize: fontSize.md }}>{t('common.delete')}</Text>
        </TouchableOpacity>
      </View>

      <Card variant="elevated" style={{ alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm, borderLeftColor: med.color, borderLeftWidth: 4 }}>
        <View
          style={[
            styles.medIcon,
            { backgroundColor: med.color + '20' },
          ]}
        >
          <Text style={{ fontSize: 36 }}>💊</Text>
        </View>
        <Text style={[styles.medName, { color: isDark ? colors.dark.text : colors.light.text }]}>
          {med.name}
        </Text>
        <Text style={[styles.medDosage, { color: isDark ? colors.dark.textSecondary : colors.light.textSecondary }]}>
          {med.dosage} {translateUnit(med.unit, locale)}
        </Text>
      </Card>

      <Card variant="elevated">
        <Text style={[styles.sectionTitle, { color: isDark ? colors.dark.text : colors.light.text }]}>
          {t('medDetail.schedule')}
        </Text>
        {med.reminderTimes.map((rt) => (
          <View key={rt.id} style={[styles.logRow, { borderBottomColor: isDark ? colors.dark.border : colors.light.border }]}>
            <Text style={{ color: isDark ? colors.dark.text : colors.light.text, fontSize: fontSize.sm }}>
              {formatTime(rt.time)}
            </Text>
            {rt.days && (
              <Text style={{ color: isDark ? colors.dark.textSecondary : colors.light.textSecondary, fontSize: fontSize.xs }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => t('day.short.' + d)).filter((_, i) => rt.days?.includes(i)).join(', ')}
              </Text>
            )}
          </View>
        ))}
      </Card>

      <Card variant="elevated">
        <Text style={[styles.sectionTitle, { color: isDark ? colors.dark.text : colors.light.text }]}>
          {t('medDetail.details')}
        </Text>
        <View style={styles.detailRow}>
          <Text style={{ color: isDark ? colors.dark.textSecondary : colors.light.textSecondary, fontSize: fontSize.sm }}>{t('medDetail.startDate')}</Text>
          <Text style={{ color: isDark ? colors.dark.text : colors.light.text, fontSize: fontSize.sm, fontWeight: fontWeight.medium }}>
            {formatDate(med.startDate)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={{ color: isDark ? colors.dark.textSecondary : colors.light.textSecondary, fontSize: fontSize.sm }}>{t('medDetail.endDate')}</Text>
          <Text style={{ color: isDark ? colors.dark.text : colors.light.text, fontSize: fontSize.sm, fontWeight: fontWeight.medium }}>
            {formatDate(med.endDate)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={{ color: isDark ? colors.dark.textSecondary : colors.light.textSecondary, fontSize: fontSize.sm }}>{t('medDetail.type')}</Text>
          <Text style={{ color: isDark ? colors.dark.text : colors.light.text, fontSize: fontSize.sm, fontWeight: fontWeight.medium }}>
            {med.reminderType}
          </Text>
        </View>
        {med.notes && (
          <View style={[styles.detailRow, { flexDirection: 'column', alignItems: 'flex-start', gap: spacing.xs }]}>
            <Text style={{ color: isDark ? colors.dark.textSecondary : colors.light.textSecondary, fontSize: fontSize.sm }}>{t('medDetail.notes')}</Text>
            <Text style={{ color: isDark ? colors.dark.text : colors.light.text, fontSize: fontSize.sm }}>{med.notes}</Text>
          </View>
        )}
      </Card>

      <Card variant="elevated">
        <Text style={[styles.sectionTitle, { color: isDark ? colors.dark.text : colors.light.text }]}>
          {t('medDetail.recentActivity')}
        </Text>
        {recentLogs.length === 0 ? (
          <Text style={{ color: isDark ? colors.dark.textTertiary : colors.light.textTertiary, fontSize: fontSize.sm }}>
            {t('medDetail.noActivity')}
          </Text>
        ) : (
          recentLogs.map((log) => (
            <View key={log.id} style={[styles.logRow, { borderBottomColor: isDark ? colors.dark.border : colors.light.border }]}>
              <Text style={{ color: isDark ? colors.dark.text : colors.light.text, fontSize: fontSize.sm }}>
                {formatDate(log.scheduledTime)}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor:
                      log.status === 'taken' ? colors.light.success :
                      log.status === 'skipped' ? colors.light.warning :
                      log.status === 'snoozed' ? colors.light.secondary :
                      colors.light.textTertiary,
                  }}
                />
                <Text style={{ color: isDark ? colors.dark.textSecondary : colors.light.textSecondary, fontSize: fontSize.xs, textTransform: 'capitalize' }}>
                  {log.status}
                </Text>
              </View>
            </View>
          ))
        )}
      </Card>

      <Button
        title={t('medDetail.edit')}
        variant="outline"
        onPress={() => {}}
        style={{ marginTop: spacing.md }}
      />
      <AdBanner />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  medHeader: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  medIcon: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  medName: { fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  medDosage: { fontSize: fontSize.md },
  sectionTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, marginBottom: spacing.sm },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  logRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1 },
});
