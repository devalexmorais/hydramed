import { View, Text, ScrollView, Switch, TouchableOpacity, StyleSheet, TextInput, Alert, Modal } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/useAuthStore';
import { useIsDark, useSettingsStore } from '@/stores/useSettingsStore';
import { useMedicationStore } from '@/stores/useMedicationStore';
import { Card } from '@/components/ui/Card';
import { useTranslation, t as translate } from '@/i18n';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/lib/theme';
import { distributeWaterReminders } from '@/lib/utils';
import { cancelAllHydrationReminders, cancelAllNotifications } from '@/lib/notifications';
import * as Notifications from 'expo-notifications';
import { Medication } from '@/types';

type EditTarget =
  | { type: 'medication'; medicationId: number; time: string }
  | { type: 'hydration'; time: string };

export default function NotificationScheduleScreen() {
  const isDark = useIsDark();
  const { t, locale } = useTranslation();
  const { user, saveUser } = useAuthStore();
  const { medications, updateMedication } = useMedicationStore();
  const { notificationsEnabled, setNotificationsEnabled } = useSettingsStore();

  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [editValue, setEditValue] = useState('');

  const [wakeUp, setWakeUp] = useState(user?.wakeUpTime || '07:00');
  const [sleep, setSleep] = useState(user?.sleepTime || '23:00');
  const [waterGoal, setWaterGoal] = useState(String(user?.waterGoal || 2000));
  const [waterEnabledState, setWaterEnabledState] = useState<Record<string, boolean>>({});
  const [medEnabled, setMedEnabled] = useState<Record<string, boolean>>({});
  const [waterTimes, setWaterTimes] = useState<string[]>(
    distributeWaterReminders(
      user?.waterGoal || 2000,
      user?.wakeUpTime || '07:00',
      user?.sleepTime || '23:00'
    )
  );

  function timeKey(medId: number, scheduleTime: string) {
    return `${medId}:${scheduleTime}`;
  }

  useFocusEffect(
    useCallback(() => {
      loadNotificationState();
    }, [medications])
  );

  async function loadNotificationState() {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();

    const medState: Record<string, boolean> = {};
    const waterState: Record<string, boolean> = {};

    for (const n of scheduled) {
      const data = n.content.data as Record<string, unknown> | undefined;
      if (data?.type === 'hydration') {
        if (data?.scheduledTime) {
          waterState[data.scheduledTime as string] = true;
        }
      }
      if (data?.type === 'medication' && data?.medicationId) {
        const key = timeKey(data.medicationId as number, data.scheduledTime as string);
        medState[key] = true;
      }
    }

    for (const med of medications) {
      for (const rt of med.reminderTimes) {
        const key = timeKey(med.id, rt.time);
        if (medState[key] === undefined) {
          medState[key] = true;
        }
      }
    }

    setMedEnabled(medState);

    setWakeUp(user?.wakeUpTime || '07:00');
    setSleep(user?.sleepTime || '23:00');
    setWaterGoal(String(user?.waterGoal || 2000));

    const times = distributeWaterReminders(
      Number(user?.waterGoal || 2000),
      user?.wakeUpTime || '07:00',
      user?.sleepTime || '23:00'
    );
    setWaterTimes(times);

    for (const t of times) {
      if (waterState[t] === undefined) {
        waterState[t] = true;
      }
    }
    setWaterEnabledState(waterState);
  }

  async function toggleReminderTime(medicationId: number, scheduledTime: string, enabled: boolean) {
    const key = timeKey(medicationId, scheduledTime);
    setMedEnabled((prev) => ({ ...prev, [key]: enabled }));

    if (!enabled) {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const n of scheduled) {
        if (n.content.data?.medicationId === medicationId && n.content.data?.scheduledTime === scheduledTime) {
          await Notifications.cancelScheduledNotificationAsync(n.identifier);
        }
      }
    } else {
      const med = medications.find((m) => m.id === medicationId);
      if (!med) return;
      const [h, m] = scheduledTime.split(':').map(Number);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: translate('notif.medTitle', locale),
          body: translate('notif.medBody', locale, {
            name: med.name,
            dosage: med.dosage,
            unit: med.unit,
          }),
          data: { medicationId, type: 'medication', scheduledTime },
          categoryIdentifier: 'medication',
        },
        trigger: {
          type: 'daily',
          hour: h,
          minute: m,
          repeats: true,
        } as any,
      });
    }
  }

  async function toggleWaterTime(time: string, enabled: boolean) {
    setWaterEnabledState((prev) => ({ ...prev, [time]: enabled }));

    if (!enabled) {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const n of scheduled) {
        const data = n.content.data as Record<string, unknown> | undefined;
        if (data?.type === 'hydration' && (!data?.scheduledTime || data.scheduledTime === time)) {
          await Notifications.cancelScheduledNotificationAsync(n.identifier);
        }
      }
    } else {
      const [h, m] = time.split(':').map(Number);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: translate('notif.waterTitle', locale),
          body: translate('notif.waterBody', locale),
          data: { type: 'hydration', scheduledTime: time },
          categoryIdentifier: 'hydration',
        },
        trigger: {
          type: 'daily',
          hour: h,
          minute: m,
          repeats: true,
        } as any,
      });
    }
  }

  async function toggleMasterNotifications(enabled: boolean) {
    setNotificationsEnabled(enabled);
    if (!enabled) {
      await cancelAllNotifications();
    } else {
      for (const med of medications) {
        for (const rt of med.reminderTimes) {
          const key = timeKey(med.id, rt.time);
          if (medEnabled[key] !== false) {
            const [h, m] = rt.time.split(':').map(Number);
            await Notifications.scheduleNotificationAsync({
              content: {
                title: translate('notif.medTitle', locale),
                body: translate('notif.medBody', locale, { name: med.name, dosage: med.dosage, unit: med.unit }),
                data: { medicationId: med.id, type: 'medication', scheduledTime: rt.time },
                categoryIdentifier: 'medication',
              },
              trigger: { type: 'daily', hour: h, minute: m, repeats: true } as any,
            });
          }
        }
      }
      for (const time of waterTimes) {
        if (waterEnabledState[time] !== false) {
          const [h, m] = time.split(':').map(Number);
          await Notifications.scheduleNotificationAsync({
            content: {
              title: translate('notif.waterTitle', locale),
              body: translate('notif.waterBody', locale),
              data: { type: 'hydration', scheduledTime: time },
              categoryIdentifier: 'hydration',
            },
            trigger: { type: 'daily', hour: h, minute: m, repeats: true } as any,
          });
        }
      }
    }
  }

  async function handleSaveEdit() {
    if (!editTarget) return;
    const newTime = editValue.trim();
    if (!newTime.match(/^\d{2}:\d{2}$/)) {
      Alert.alert(t('common.error'), t('onboard.validTime'));
      return;
    }
    const oldTime = editTarget.time;

    if (editTarget.type === 'hydration') {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const n of scheduled) {
        const d = n.content.data as Record<string, unknown> | undefined;
        if (d?.type === 'hydration' && d?.scheduledTime === oldTime) {
          await Notifications.cancelScheduledNotificationAsync(n.identifier);
        }
      }

      const [h, m] = newTime.split(':').map(Number);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: translate('notif.waterTitle', locale),
          body: translate('notif.waterBody', locale),
          data: { type: 'hydration', scheduledTime: newTime },
          categoryIdentifier: 'hydration',
        },
        trigger: { type: 'daily', hour: h, minute: m, repeats: true } as any,
      });

      setWaterTimes(prev => prev.map(t => t === oldTime ? newTime : t));
      setWaterEnabledState(prev => {
        const next = { ...prev };
        next[newTime] = prev[oldTime] ?? true;
        delete next[oldTime];
        return next;
      });
    } else {
      const med = medications.find(m => m.id === editTarget.medicationId);
      if (!med) return;

      const updatedTimes = med.reminderTimes.map(rt =>
        rt.time === oldTime ? { ...rt, time: newTime } : rt
      );
      await updateMedication(editTarget.medicationId, { reminderTimes: updatedTimes });

      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const n of scheduled) {
        if (n.content.data?.medicationId === editTarget.medicationId && n.content.data?.scheduledTime === oldTime) {
          await Notifications.cancelScheduledNotificationAsync(n.identifier);
        }
      }

      const [h, m] = newTime.split(':').map(Number);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: translate('notif.medTitle', locale),
          body: translate('notif.medBody', locale, { name: med.name, dosage: med.dosage, unit: med.unit }),
          data: { medicationId: editTarget.medicationId, type: 'medication', scheduledTime: newTime },
          categoryIdentifier: 'medication',
        },
        trigger: { type: 'daily', hour: h, minute: m, repeats: true } as any,
      });

      const oldKey = timeKey(editTarget.medicationId, oldTime);
      const newKey = timeKey(editTarget.medicationId, newTime);
      setMedEnabled(prev => {
        const next = { ...prev };
        next[newKey] = prev[oldKey] ?? true;
        delete next[oldKey];
        return next;
      });
    }

    setEditTarget(null);
    setEditValue('');
  }

  function formatTimeSafe(time: string) {
    return time;
  }

  const bg = isDark ? colors.dark.background : colors.light.background;
  const textColor = isDark ? colors.dark.text : colors.light.text;
  const textSecondary = isDark ? colors.dark.textSecondary : colors.light.textSecondary;
  const border = isDark ? colors.dark.border : colors.light.border;
  const surface = isDark ? colors.dark.surface : colors.light.surface;
  const surfaceSecondary = isDark ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary;

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>
          {t('notifSchedule.title')}
        </Text>
        <Switch
          value={notificationsEnabled}
          onValueChange={toggleMasterNotifications}
          trackColor={{ false: surfaceSecondary, true: colors.light.primaryLight }}
          thumbColor={notificationsEnabled ? colors.light.primary : colors.light.textTertiary}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {!notificationsEnabled ? (
          <View style={styles.centerMessage}>
            <Ionicons name="notifications-off-outline" size={48} color={textSecondary} />
            <Text style={[styles.centerMessageText, { color: textSecondary }]}>
              {locale.startsWith('pt') ? 'Por favor, ative a função de lembrete primeiro' : locale.startsWith('es') ? 'Por favor, activa la función de recordatorio primero' : 'Please enable the reminder function first'}
            </Text>
          </View>
        ) : (
        <>
        {/* Hydration Reminders */}
        <Card variant="elevated">
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
              <Ionicons name="water-outline" size={20} color={colors.light.secondary} />
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                {t('notifSchedule.waterReminders')}
              </Text>
            </View>
          </View>

          <Text style={[styles.sectionDesc, { color: textSecondary }]}>
            {t('notifSchedule.waterDesc')}
          </Text>

          {/* Controls */}
          <View style={styles.waterControls}>
            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: textSecondary }]}>
                  {t('notifSchedule.wakeUp')}
                </Text>
                <TextInput
                  style={[styles.input, { color: textColor, borderColor: border, backgroundColor: surfaceSecondary }]}
                  value={wakeUp}
                  onChangeText={setWakeUp}
                  placeholder="07:00"
                  placeholderTextColor={isDark ? colors.dark.textTertiary : colors.light.textTertiary}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: textSecondary }]}>
                  {t('notifSchedule.sleep')}
                </Text>
                <TextInput
                  style={[styles.input, { color: textColor, borderColor: border, backgroundColor: surfaceSecondary }]}
                  value={sleep}
                  onChangeText={setSleep}
                  placeholder="23:00"
                  placeholderTextColor={isDark ? colors.dark.textTertiary : colors.light.textTertiary}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: textSecondary }]}>
                {t('notifSchedule.waterGoal')}
              </Text>
              <TextInput
                style={[styles.input, { color: textColor, borderColor: border, backgroundColor: surfaceSecondary }]}
                value={waterGoal}
                onChangeText={setWaterGoal}
                placeholder="2000"
                placeholderTextColor={isDark ? colors.dark.textTertiary : colors.light.textTertiary}
                keyboardType="number-pad"
              />
            </View>
          </View>

          {/* Water times list with individual toggles */}
          <View style={styles.timesList}>
            <Text style={[styles.timesCount, { color: textSecondary }]}>
              {t('notifSchedule.times', { count: waterTimes.length })}
            </Text>
            {waterTimes.map((time) => {
              const enabled = waterEnabledState[time] ?? true;
              return (
                <View key={time} style={[styles.waterTimeRow, { borderBottomColor: border }]}>
                  <Ionicons
                    name="water"
                    size={14}
                    color={enabled ? colors.light.secondary : textSecondary}
                  />
                  <Text
                    style={[
                      styles.waterTimeText,
                      { color: enabled ? textColor : textSecondary, opacity: enabled ? 1 : 0.5 },
                    ]}
                  >
                    {formatTimeSafe(time)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => { setEditTarget({ type: 'hydration', time }); setEditValue(time); }}
                    style={styles.editTimeBtn}
                  >
                    <Ionicons name="pencil" size={14} color={textSecondary} />
                  </TouchableOpacity>
                  <Switch
                    value={enabled}
                    disabled={!notificationsEnabled}
                    onValueChange={(val) => toggleWaterTime(time, val)}
                    trackColor={{ false: surfaceSecondary, true: colors.light.primaryLight }}
                    thumbColor={enabled ? colors.light.primary : colors.light.textTertiary}
                  />
                </View>
              );
            })}
          </View>

        </Card>

        {/* Medication Reminders */}
        <Card variant="elevated">
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
              <Ionicons name="medkit-outline" size={20} color={colors.light.primary} />
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                {t('notifSchedule.medReminders')}
              </Text>
            </View>
          </View>

          {medications.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="medkit-outline" size={40} color={textSecondary} />
              <Text style={[styles.emptyText, { color: textSecondary }]}>
                {t('notifSchedule.noMeds')}
              </Text>
            </View>
          ) : (
            <View style={{ gap: spacing.md }}>
              {medications.map((med) => (
                <MedicationNotificationCard
                  key={med.id}
                  medication={med}
                  getEnabled={(time: string) => medEnabled[timeKey(med.id, time)] ?? true}
                  onToggle={(time, enabled) => toggleReminderTime(med.id, time, enabled)}
                  onEdit={() => router.push(`/medication/${med.id}`)}
                  onEditTime={(time) => { setEditTarget({ type: 'medication', medicationId: med.id, time }); setEditValue(time); }}
                  notificationsEnabled={notificationsEnabled}
                  isDark={isDark}
                  t={t}
                  formatTimeSafe={formatTimeSafe}
                />
              ))}
            </View>
          )}
        </Card>
        </>
        )}
      </ScrollView>

      {/* Edit Time Modal */}
      <Modal visible={editTarget !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: surface, borderColor: border }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>
              {editTarget?.type === 'hydration' ? t('notifSchedule.waterReminders') : t('meds.title')}
            </Text>
            <TextInput
              style={[styles.modalInput, { color: textColor, borderColor: border, backgroundColor: surfaceSecondary }]}
              value={editValue}
              onChangeText={setEditValue}
              placeholder="HH:MM"
              placeholderTextColor={isDark ? colors.dark.textTertiary : colors.light.textTertiary}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => { setEditTarget(null); setEditValue(''); }}
                style={[styles.modalBtn, { borderColor: border }]}
              >
                <Text style={{ color: textSecondary, fontSize: fontSize.sm, fontWeight: fontWeight.semibold }}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveEdit}
                style={[styles.modalBtn, { backgroundColor: colors.light.primary, borderColor: colors.light.primary }]}
              >
                <Text style={{ color: '#FFFFFF', fontSize: fontSize.sm, fontWeight: fontWeight.semibold }}>
                  {t('common.save')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function MedicationNotificationCard({
  medication,
  getEnabled,
  onToggle,
  onEdit,
  onEditTime,
  notificationsEnabled,
  isDark,
  t,
  formatTimeSafe,
}: {
  medication: Medication;
  getEnabled: (time: string) => boolean;
  onToggle: (time: string, enabled: boolean) => void;
  onEdit: () => void;
  onEditTime: (time: string) => void;
  notificationsEnabled: boolean;
  isDark: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatTimeSafe: (time: string) => string;
}) {
  const textColor = isDark ? colors.dark.text : colors.light.text;
  const textSecondary = isDark ? colors.dark.textSecondary : colors.light.textSecondary;
  const border = isDark ? colors.dark.border : colors.light.border;

  return (
    <View style={[medCardStyles.card, { backgroundColor: isDark ? colors.dark.surfaceSecondary : '#F8FAFC', borderColor: border }]}>
      <View style={medCardStyles.header}>
        <View style={medCardStyles.medInfo}>
          <View style={[medCardStyles.colorDot, { backgroundColor: medication.color }]} />
          <View style={{ flex: 1 }}>
            <Text style={[medCardStyles.medName, { color: textColor }]}>
              {medication.name}
            </Text>
            <Text style={[medCardStyles.medDosage, { color: textSecondary }]}>
              {medication.dosage}{medication.unit}
            </Text>
          </View>
          <TouchableOpacity onPress={onEdit} style={medCardStyles.editBtn}>
            <Ionicons name="create-outline" size={18} color={colors.light.primary} />
            <Text style={{ color: colors.light.primary, fontSize: fontSize.xs, fontWeight: fontWeight.medium }}>
              {t('notifSchedule.editMed')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={medCardStyles.timesContainer}>
        {medication.reminderTimes.map((rt, i) => {
          const enabled = getEnabled(rt.time);
          return (
            <View
              key={rt.id}
              style={[
                medCardStyles.timeItem,
                { borderBottomColor: border },
                i === medication.reminderTimes.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <Ionicons
                name="time-outline"
                size={16}
                color={enabled ? (isDark ? colors.dark.primary : colors.light.primary) : textSecondary}
              />
              <Text
                style={[
                  medCardStyles.timeText,
                  {
                    color: enabled ? textColor : textSecondary,
                    opacity: enabled ? 1 : 0.5,
                  },
                ]}
              >
                {formatTimeSafe(rt.time)}
              </Text>
              <TouchableOpacity
                onPress={() => onEditTime(rt.time)}
                style={medCardStyles.editTimeBtn}
              >
                <Ionicons name="pencil" size={13} color={textSecondary} />
              </TouchableOpacity>
              <Switch
                value={enabled}
                disabled={!notificationsEnabled}
                onValueChange={(val) => onToggle(rt.time, val)}
                trackColor={{ false: isDark ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary, true: colors.light.primaryLight }}
                thumbColor={enabled ? colors.light.primary : colors.light.textTertiary}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  modalTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.lg,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modalBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
    flexGrow: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  sectionDesc: {
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  waterControls: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  inputGroup: {
    flex: 1,
    gap: 2,
  },
  inputLabel: {
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.medium,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: fontSize.sm,
  },
  timesList: {
    gap: 2,
  },
  timesCount: {
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.medium,
    marginBottom: 2,
  },
  waterTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  waterTimeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  editTimeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
    gap: spacing.md,
  },
  centerMessageText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    lineHeight: 22,
  },
  emptyState: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: fontSize.sm,
  },
});

const medCardStyles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  medInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  medName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  medDosage: {
    fontSize: fontSize.xxs,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  timesContainer: {},
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  timeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  editTimeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
