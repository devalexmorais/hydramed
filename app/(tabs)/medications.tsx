import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useMedicationStore } from '@/stores/useMedicationStore';
import { useIsDark } from '@/stores/useSettingsStore';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/lib/theme';
import { formatTime } from '@/lib/utils';
import { Medication, MedicationLog } from '@/types';
import { useTranslation, translateUnit } from '@/i18n';
import { useInterstitial } from '@/components/InterstitialAdManager';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// Helper to determine the material icon based on medication unit
function getMedicationIcon(unit: string = '') {
  const u = unit.toLowerCase();
  if (u.includes('caps') || u.includes('cáp')) {
    return 'pill';
  } else if (u.includes('ml') || u.includes('got') || u.includes('liqu') || u.includes('xar')) {
    return 'bottle-tonic-plus-outline';
  } else if (u.includes('tab') || u.includes('comp') || u.includes('dose')) {
    return 'circle-double';
  }
  return 'pill';
}

// Helper to construct localized frequency text
function getFrequencyText(med: Medication, locale: string) {
  const isPt = locale.startsWith('pt');
  const isEs = locale.startsWith('es');

  if (med.reminderTimes.length === 0) {
    return isPt ? 'Se necessário' : isEs ? 'Si es necesario' : 'As needed';
  }
  if (med.reminderType === 'once') {
    return isPt ? 'Todo dia' : isEs ? 'Cada día' : 'Everyday';
  } else if (med.reminderType === 'interval') {
    const hrs = med.intervalHours || 8;
    return isPt ? `A cada ${hrs} horas` : isEs ? `Cada ${hrs} horas` : `Every ${hrs} hours`;
  } else if (med.reminderType === 'weekdays') {
    return isPt ? 'Dias específicos' : isEs ? 'Días específicos' : 'Specific days';
  } else {
    return isPt ? 'Várias vezes ao dia' : isEs ? 'Varias veces al día' : 'Multiple times a day';
  }
}

export default function MedicationsScreen() {
  const { showInterstitial } = useInterstitial();
  const { medications, todayLogs, loadMedications, loadTodayLogs, generateTodayLogs, logStatus } = useMedicationStore();
  const isDark = useIsDark();
  const { t, locale } = useTranslation();
  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'history'>('all');

  // Load data on screen focus
  useFocusEffect(
    useCallback(() => {
      async function loadData() {
        await loadMedications();
        await generateTodayLogs();
        await loadTodayLogs();
      }
      loadData();
    }, [])
  );

  const activeMeds = medications.filter((m) => m.isActive);

  // Summary counts
  const totalDoses = todayLogs.length;
  const takenCount = todayLogs.filter((l) => l.status === 'taken').length;
  const pendingCount = todayLogs.filter((l) => l.status === 'pending').length;
  const missedCount = todayLogs.filter((l) => l.status === 'skipped').length;

  // Filter list based on activeTab
  const getFilteredMedications = () => {
    if (activeTab === 'all') {
      return activeMeds;
    } else if (activeTab === 'today') {
      // Show meds scheduled for today (have logs today, or have reminderTimes)
      return activeMeds.filter((m) => m.reminderTimes.length > 0 || todayLogs.some((l) => l.medicationId === m.id));
    } else {
      // History tab shows active meds with logs today
      return activeMeds.filter((m) => todayLogs.some((l) => l.medicationId === m.id));
    }
  };

  const filteredMeds = getFilteredMedications();

  // Helper to parse today's log status for a medication card
  const getMedicationStatus = (med: Medication) => {
    const medLogs = todayLogs.filter((l) => l.medicationId === med.id);
    const isPt = locale.startsWith('pt');
    const isEs = locale.startsWith('es');

    if (med.reminderTimes.length === 0) {
      return {
        label: isPt ? 'Se necessário' : isEs ? 'Si es necesario' : 'As needed',
        color: '#64748B',
        bgColor: isDark ? 'rgba(100, 116, 139, 0.15)' : '#F1F5F9',
        type: 'as_needed',
      };
    }

    if (medLogs.length === 0) {
      return {
        label: isPt ? 'Sem agendamento' : isEs ? 'Sin agenda' : 'No schedule',
        color: '#64748B',
        bgColor: isDark ? 'rgba(100, 116, 139, 0.15)' : '#F1F5F9',
        type: 'as_needed',
      };
    }

    const allTaken = medLogs.every((l) => l.status === 'taken');
    if (allTaken) {
      return {
        label: isPt ? 'Tomado' : isEs ? 'Tomado' : 'Taken',
        color: '#10B981',
        bgColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#E8F5E9',
        type: 'taken',
      };
    }

    const anySkipped = medLogs.some((l) => l.status === 'skipped');
    if (anySkipped) {
      return {
        label: isPt ? 'Pulado' : isEs ? 'Omitido' : 'Skipped',
        color: '#EF4444',
        bgColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
        type: 'skipped',
      };
    }

    return {
      label: isPt ? 'Pendente' : isEs ? 'Pendiente' : 'Upcoming',
      color: '#3B82F6',
      bgColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#E0F2FE',
      type: 'upcoming',
    };
  };

  // Timeline list (sorted chronologically)
  const getTimelineItems = () => {
    return [...todayLogs].sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  };

  const timelineItems = getTimelineItems();

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.dark.background : '#F5F7FA' }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Premium Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.title, { color: isDark ? colors.dark.text : '#1E293B' }]}>
              💊 {t('meds.title')}
            </Text>
            <Text style={[styles.subtitle, { color: isDark ? colors.dark.textTertiary : '#64748B' }]}>
              {locale.startsWith('pt') ? 'Gerencie seus medicamentos e lembretes' : locale.startsWith('es') ? 'Administra tus medicinas y recordatorios' : 'Manage your medications and reminders'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/notification-schedule')}
            style={[styles.notifBtn, { backgroundColor: isDark ? colors.dark.surface : '#FFFFFF', borderColor: isDark ? colors.dark.border : '#E2E8F0' }]}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={20} color={isDark ? colors.dark.primary : '#0EA5E9'} />
          </TouchableOpacity>
        </View>

        {/* Dynamic Summary Cards Row */}
        <View style={styles.row}>
          {/* Taken Today Card */}
          <View style={[styles.summaryCard, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#E8F5E9', borderColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#C8E6C9' }]}>
            <View style={[styles.summaryIconWrapper, { backgroundColor: '#10B981' }]}>
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            </View>
            <Text style={[styles.summaryTitleText, { color: isDark ? '#A7F3D0' : '#065F46' }]}>
              {locale.startsWith('pt') ? 'Tomados Hoje' : locale.startsWith('es') ? 'Tomados Hoy' : 'Taken Today'}
            </Text>
            <Text style={[styles.summaryValueText, { color: isDark ? '#FFFFFF' : '#065F46' }]}>
              {takenCount} <Text style={styles.summaryValueSub}>{locale.startsWith('pt') ? `de ${totalDoses}` : `of ${totalDoses}`}</Text>
            </Text>
          </View>

          {/* Upcoming Card */}
          <View style={[styles.summaryCard, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.1)' : '#F3E8FF', borderColor: isDark ? 'rgba(139, 92, 246, 0.2)' : '#E9D5FF' }]}>
            <View style={[styles.summaryIconWrapper, { backgroundColor: '#8B5CF6' }]}>
              <Ionicons name="time" size={14} color="#FFFFFF" />
            </View>
            <Text style={[styles.summaryTitleText, { color: isDark ? '#DDD6FE' : '#5B21B6' }]}>
              {locale.startsWith('pt') ? 'Próximos' : locale.startsWith('es') ? 'Siguientes' : 'Upcoming'}
            </Text>
            <Text style={[styles.summaryValueText, { color: isDark ? '#FFFFFF' : '#5B21B6' }]}>
              {pendingCount} <Text style={styles.summaryValueSub}>{locale.startsWith('pt') ? 'doses' : 'next dose'}</Text>
            </Text>
          </View>

          {/* Missed Card */}
          <View style={[styles.summaryCard, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FFEBEE', borderColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FFCDD2' }]}>
            <View style={[styles.summaryIconWrapper, { backgroundColor: '#EF4444' }]}>
              <Ionicons name="close" size={14} color="#FFFFFF" />
            </View>
            <Text style={[styles.summaryTitleText, { color: isDark ? '#FECACA' : '#991B1B' }]}>
              {locale.startsWith('pt') ? 'Perdidos' : locale.startsWith('es') ? 'Omitidos' : 'Missed'}
            </Text>
            <Text style={[styles.summaryValueText, { color: isDark ? '#FFFFFF' : '#991B1B' }]}>
              {missedCount} <Text style={styles.summaryValueSub}>{locale.startsWith('pt') ? 'hoje' : 'today'}</Text>
            </Text>
          </View>
        </View>

        {/* Tab Filters */}
        <View style={[styles.tabBar, { borderBottomColor: isDark ? colors.dark.border : '#E2E8F0' }]}>
          {[
            { id: 'all', title: locale.startsWith('pt') ? 'Todos' : locale.startsWith('es') ? 'Todos' : 'All Medications' },
            { id: 'today', title: locale.startsWith('pt') ? 'Hoje' : locale.startsWith('es') ? 'Hoy' : 'Today' },
            { id: 'history', title: locale.startsWith('pt') ? 'Histórico' : locale.startsWith('es') ? 'Historial' : 'History' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabItem, isActive && { borderBottomColor: isDark ? colors.dark.primary : '#6366F1' }]}
                onPress={() => setActiveTab(tab.id as any)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, { color: isActive ? (isDark ? colors.dark.primary : '#6366F1') : '#94A3B8', fontWeight: isActive ? '700' : '500' }]}>
                  {tab.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Medications List */}
        <View style={{ gap: spacing.md }}>
          {filteredMeds.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: isDark ? colors.dark.surface : '#FFFFFF', borderColor: isDark ? colors.dark.border : '#E2E8F0' }]}>
              <Text style={styles.emptyIcon}>💊</Text>
              <Text style={[styles.emptyTitle, { color: isDark ? colors.dark.text : colors.light.text }]}>
                {t('meds.emptyTitle')}
              </Text>
              <Text style={[styles.emptyDesc, { color: isDark ? colors.dark.textSecondary : colors.light.textSecondary }]}>
                {t('meds.emptyDesc')}
              </Text>
            </View>
          ) : (
            filteredMeds.map((med) => {
              const status = getMedicationStatus(med);
              const medIcon = getMedicationIcon(med.unit);
              const medLogs = todayLogs.filter((l) => l.medicationId === med.id);

              // Sub-bar dynamic contents
              const renderSubBar = () => {
                const isPt = locale.startsWith('pt');
                const isEs = locale.startsWith('es');

                const handleQuickTake = async () => {
                  const pendingLogsToday = medLogs.filter((l) => l.status === 'pending');
                  if (pendingLogsToday.length > 0) {
                    const sorted = [...pendingLogsToday].sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
                    await logStatus(med.id, sorted[0].scheduledTime, 'taken');
                    showInterstitial();
                  }
                };

                const handleAsNeededTake = async () => {
                  const now = new Date();
                  const today = now.toISOString().split('T')[0];
                  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                  await logStatus(med.id, `${today} ${timeStr}`, 'taken');
                  showInterstitial();
                };

                if (med.reminderTimes.length === 0) {
                  return (
                    <View style={[styles.cardSubBar, { backgroundColor: isDark ? '#334155' : '#F8FAFC' }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                        <Ionicons name="information-circle-outline" size={14} color="#94A3B8" />
                        <Text style={styles.cardSubBarText}>
                          {isPt ? 'Se necessário' : isEs ? 'Si es necesario' : 'As needed'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.quickActionBtn, { backgroundColor: isDark ? '#1E293B' : '#EEF2FF' }]}
                        onPress={handleAsNeededTake}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="checkmark" size={16} color="#6366F1" />
                        <Text style={styles.quickActionBtnText}>
                          {isPt ? 'Tomar' : isEs ? 'Tomar' : "Take"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                }

                if (medLogs.length === 0) {
                  return (
                    <View style={[styles.cardSubBar, { backgroundColor: isDark ? '#334155' : '#F8FAFC' }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                        <Ionicons name="information-circle-outline" size={14} color="#94A3B8" />
                        <Text style={styles.cardSubBarText}>
                          {isPt ? 'Sem doses agendadas hoje' : isEs ? 'Sin dosis programadas hoy' : 'No doses scheduled today'}
                        </Text>
                      </View>
                    </View>
                  );
                }

                const takenLogs = medLogs.filter((l) => l.status === 'taken');
                const pendingLogs = medLogs.filter((l) => l.status === 'pending');

                // Case 1: All doses taken today
                if (pendingLogs.length === 0 && takenLogs.length > 0) {
                  const lastTaken = [...takenLogs].sort((a, b) => b.completedAt!.localeCompare(a.completedAt!))[0];
                  const lastTimeStr = lastTaken.completedAt ? new Date(lastTaken.completedAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) : '';

                  // Next dose is tomorrow first dose
                  const nextDoseTime = med.reminderTimes[0]?.time || '';

                  const handleUndoLastTaken = async () => {
                    await logStatus(med.id, lastTaken.scheduledTime, 'pending');
                  };

                  return (
                    <View style={[styles.cardSubBar, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#F0FDF4' }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
                        <Ionicons name="checkmark-circle" size={13} color="#10B981" />
                        <Text style={[styles.cardSubBarText, { color: isDark ? '#A7F3D0' : '#15803D' }]}>
                          {isPt ? `Tomado às ${lastTimeStr}` : isEs ? `Tomado a las ${lastTimeStr}` : `Taken at ${lastTimeStr}`}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={handleUndoLastTaken}
                        activeOpacity={0.7}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: spacing.sm }}
                      >
                        <Ionicons name="arrow-undo" size={14} color="#F59E0B" />
                        <Text style={[styles.cardSubBarText, { color: '#F59E0B', fontWeight: '600' }]}>
                          {isPt ? 'Desfazer' : isEs ? 'Deshacer' : 'Undo'}
                        </Text>
                      </TouchableOpacity>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="alarm-outline" size={13} color="#94A3B8" />
                        <Text style={styles.cardSubBarText}>
                          {isPt ? `Amanhã ${formatTime(nextDoseTime)}` : isEs ? `Mañana ${formatTime(nextDoseTime)}` : `Tomorrow ${formatTime(nextDoseTime)}`}
                        </Text>
                      </View>
                    </View>
                  );
                }

                // Case 2: There are pending doses today
                if (pendingLogs.length > 0) {
                  const sortedPending = [...pendingLogs].sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
                  const nextPending = sortedPending[0];
                  const nextTimeStr = nextPending.scheduledTime.split(' ')[1] || '';

                  return (
                    <View style={[styles.cardSubBar, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#F0F9FF' }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
                        <Ionicons name="time" size={13} color="#3B82F6" />
                        <Text style={[styles.cardSubBarText, { color: isDark ? '#93C5FD' : '#1D4ED8' }]}>
                          {isPt ? `Próxima: ${formatTime(nextTimeStr)}` : isEs ? `Siguiente: ${formatTime(nextTimeStr)}` : `Next: ${formatTime(nextTimeStr)}`}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.quickActionBtn, { backgroundColor: isDark ? '#1E293B' : '#EEF2FF' }]}
                        onPress={handleQuickTake}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="checkmark" size={16} color="#6366F1" />
                        <Text style={styles.quickActionBtnText}>
                          {isPt ? 'Tomar' : isEs ? 'Tomar' : 'Take'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                }

                return null;
              };

              return (
                <TouchableOpacity
                  key={med.id}
                  onPress={() => router.push(`/medication/${med.id}`)}
                  activeOpacity={0.8}
                  style={[styles.medCard, { backgroundColor: isDark ? colors.dark.surface : '#FFFFFF', borderColor: isDark ? colors.dark.border : '#E2E8F0' }]}
                >
                  <View style={styles.medCardTop}>
                    {/* Icon wrapper */}
                    <View style={[styles.medIconWrapper, { backgroundColor: med.color + '20' }]}>
                      <MaterialCommunityIcons name={medIcon as any} size={22} color={med.color} />
                    </View>

                    {/* Middle details */}
                    <View style={{ flex: 1, marginLeft: spacing.xs }}>
                      <Text style={[styles.medName, { color: isDark ? colors.dark.text : '#0F172A' }]}>
                        {med.name}
                      </Text>
                      <Text style={[styles.medDetails, { color: isDark ? colors.dark.textSecondary : '#64748B' }]}>
                        {med.dosage} {translateUnit(med.unit, locale)} • {med.notes || (locale.startsWith('pt') ? 'Sem notas' : 'No instructions')}
                      </Text>

                      {/* Frequency Badge */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <Ionicons name="calendar-outline" size={12} color="#94A3B8" />
                        <Text style={{ fontSize: fontSize.xs, color: '#94A3B8', fontWeight: '500' }}>
                          {getFrequencyText(med, locale)}
                        </Text>
                      </View>
                    </View>

                    {/* Right status badge + chevron */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                      <View style={[styles.statusBadge, { backgroundColor: status.bgColor }]}>
                        <Text style={[styles.statusBadgeText, { color: status.color }]}>{status.label}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                    </View>
                  </View>

                  {/* Adaptive Sub-bar */}
                  {renderSubBar()}
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Schedule Timeline Section */}
        {timelineItems.length > 0 && (
          <View style={[styles.cardFull, { backgroundColor: isDark ? colors.dark.surface : '#FFFFFF', borderColor: isDark ? colors.dark.border : '#E2E8F0', marginTop: spacing.md }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconWrapper, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="calendar" size={16} color="#0EA5E9" />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.xs }}>
                <Text style={[styles.cardTitle, { color: isDark ? colors.dark.text : '#0F172A' }]}>
                  {locale.startsWith('pt') ? 'Agenda de Hoje' : locale.startsWith('es') ? 'Agenda de Hoy' : 'Medication Schedule Today'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/calendar')} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Text style={{ fontSize: fontSize.xs, color: '#6366F1', fontWeight: 'bold' }}>
                  {locale.startsWith('pt') ? 'Ver Agenda' : locale.startsWith('es') ? 'Ver Agenda' : 'See Full Schedule'}
                </Text>
                <Ionicons name="chevron-forward" size={12} color="#6366F1" />
              </TouchableOpacity>
            </View>

            <View style={styles.timelineList}>
              {timelineItems.map((log, index) => {
                const med = activeMeds.find((m) => m.id === log.medicationId);
                const timeStr = log.scheduledTime.split(' ')[1] || '';
                const isTaken = log.status === 'taken';
                const isSkipped = log.status === 'skipped';
                
                // Indicators colors
                let indicatorColor = '#94A3B8';
                let indicatorIcon: keyof typeof Ionicons.glyphMap = 'ellipse-outline';
                let statusLabel = locale.startsWith('pt') ? 'Pendente' : 'Pending';
                let statusColor = '#94A3B8';

                if (isTaken) {
                  indicatorColor = '#10B981';
                  indicatorIcon = 'checkmark-circle';
                  statusLabel = locale.startsWith('pt') ? 'Tomado' : 'Taken';
                  statusColor = '#10B981';
                } else if (isSkipped) {
                  indicatorColor = '#EF4444';
                  indicatorIcon = 'close-circle';
                  statusLabel = locale.startsWith('pt') ? 'Pulado' : 'Skipped';
                  statusColor = '#EF4444';
                } else {
                  // If it's the first pending item, make it look "Upcoming"
                  const firstPending = timelineItems.find((l) => l.status === 'pending');
                  if (firstPending?.id === log.id) {
                    indicatorColor = '#3B82F6';
                    indicatorIcon = 'time';
                    statusLabel = locale.startsWith('pt') ? 'Próximo' : 'Upcoming';
                    statusColor = '#3B82F6';
                  }
                }

                return (
                  <View key={log.id} style={styles.timelineRow}>
                    <Ionicons name={indicatorIcon} size={18} color={indicatorColor} />
                    <Text style={[styles.timelineTime, { color: isDark ? colors.dark.textSecondary : '#64748B' }]}>
                      {formatTime(timeStr)}
                    </Text>
                    <Text style={[styles.timelineMedName, { color: isDark ? colors.dark.text : '#1E293B', textDecorationLine: isSkipped ? 'line-through' : 'none' }]} numberOfLines={1}>
                      {log.medicationName} {med ? `(${med.dosage}${translateUnit(med.unit, locale)})` : ''}
                    </Text>
                    <Text style={[styles.timelineStatus, { color: statusColor }]}>
                      {statusLabel}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: isDark ? colors.dark.primary : '#6366F1' }]}
        onPress={() => router.push('/medication/add')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 110,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: Platform.OS === 'ios' ? 10 : 20,
    marginBottom: spacing.xs,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  subtitle: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  summaryCard: {
    flex: 1,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    gap: 4,
  },
  summaryIconWrapper: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  summaryTitleText: {
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.bold,
  },
  summaryValueText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  summaryValueSub: {
    fontSize: fontSize.xxs,
    fontWeight: 'normal',
    color: '#94A3B8',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
    marginTop: spacing.xs,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1.5,
  },
  tabText: {
    fontSize: fontSize.sm,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
  },
  emptyIcon: {
    fontSize: fontSize.xxxl,
  },
  emptyTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  emptyDesc: {
    fontSize: fontSize.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  medCard: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  medCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  medIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  medDetails: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.bold,
  },
  cardSubBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    gap: 6,
  },
  cardSubBarText: {
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.medium,
    color: '#94A3B8',
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
  },
  quickActionBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: '#6366F1',
  },
  cardFull: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  timelineList: {
    gap: spacing.sm,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  timelineTime: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    width: 65,
  },
  timelineMedName: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  timelineStatus: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
});
