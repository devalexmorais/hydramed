import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useMedicationStore } from '@/stores/useMedicationStore';
import { useWaterStore } from '@/stores/useWaterStore';
import { useStatsStore } from '@/stores/useStatsStore';
import { useIsDark } from '@/stores/useSettingsStore';
import { ProgressCircle } from '@/components/ProgressCircle';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/lib/theme';
import { formatDateFull, formatTime, distributeWaterReminders } from '@/lib/utils';
import { useTranslation, getGreeting, translateUnit } from '@/i18n';
import { useInterstitial } from '@/components/InterstitialAdManager';

import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, Path, Ellipse } from 'react-native-svg';

// Custom Premium SVG Illustration for Health Tip
function WaterBottleIllustration() {
  return (
    <Svg width={60} height={70} viewBox="0 0 80 90">
      {/* Shadows */}
      <Ellipse cx={35} cy={82} rx={18} ry={4} fill="rgba(0,0,0,0.06)" />
      <Ellipse cx={62} cy={82} rx={12} ry={3} fill="rgba(0,0,0,0.06)" />

      {/* Water Bottle */}
      <Rect x="26" y="20" width="18" height="12" rx={2} fill="#DBEAFE" />
      <Rect x="24" y="12" width="22" height="8" rx={3} fill="#2563EB" />
      <Path
        d="M 22 32 C 22 32, 16 36, 16 44 L 16 76 C 16 80, 20 80, 24 80 L 46 80 C 50 80, 54 80, 54 76 L 54 44 C 54 36, 48 32, 48 32 Z"
        fill="#EFF6FF"
        stroke="#DBEAFE"
        strokeWidth={1.5}
      />
      {/* Water inside bottle */}
      <Path
        d="M 17 48 C 17 48, 25 45, 35 48 C 45 51, 53 48, 53 48 L 53 75 C 53 78, 49 78, 46 78 L 24 78 C 21 78, 17 78, 17 75 Z"
        fill="#3B82F6"
      />
      {/* Highlights */}
      <Path d="M 22 36 L 22 74" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" opacity={0.6} />

      {/* Glass */}
      <Path
        d="M 54 52 L 70 52 L 67 78 C 67 79.5, 57 79.5, 57 78 Z"
        fill="rgba(219, 234, 254, 0.4)"
        stroke="#DBEAFE"
        strokeWidth={1.5}
      />
      <Path
        d="M 55 60 L 69 60 L 67 78 C 67 79, 57 79, 57 78 Z"
        fill="#60A5FA"
      />
      <Path d="M 58 54 L 58 74" stroke="#FFFFFF" strokeWidth={1.5} opacity={0.5} />
    </Svg>
  );
}

export default function DashboardScreen() {
  const { showInterstitial } = useInterstitial();
  const { user } = useAuthStore();
  const { medications, todayLogs, loadMedications, loadTodayLogs, logStatus, generateTodayLogs } = useMedicationStore();
  const { todayIntake, todayLogs: waterLogs, loadToday: loadWaterToday, addWater } = useWaterStore();
  const { dailyStats, weeklyStats, loadDailyStats, loadWeeklyStats } = useStatsStore();

  const isDark = useIsDark();
  const { t, locale } = useTranslation();
  // Sync data on screen focus
  useFocusEffect(
    useCallback(() => {
      async function syncData() {
        await loadMedications();
        await generateTodayLogs();
        await loadTodayLogs();
        await loadWaterToday();
        await loadDailyStats();
        await loadWeeklyStats();
      }
      syncData();
    }, [])
  );

  const greeting = getGreeting(locale);
  const todayFormatted = formatDateFull(new Date().toISOString(), locale);

  // Goal & Progress Calculations
  const waterGoal = user?.waterGoal || 2000;
  const waterProgress = Math.round((todayIntake / waterGoal) * 100);

  const totalDoses = todayLogs.length;
  const takenDoses = todayLogs.filter((l) => l.status === 'taken').length;
  const pendingDoses = todayLogs.filter((l) => l.status === 'pending').length;
  const skippedDoses = todayLogs.filter((l) => l.status === 'skipped').length;
  const medsProgress = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;

  // Next Water Reminder Time Calculation based on scheduled notification times
  const getNextWaterReminderTime = () => {
    const times = distributeWaterReminders(
      user?.waterGoal || 2000,
      user?.wakeUpTime || '07:00',
      user?.sleepTime || '23:00'
    );
    if (times.length === 0) return '10:30 AM';

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (const time of times) {
      const [h, m] = time.split(':').map(Number);
      if (h * 60 + m > currentMinutes) {
        const d = new Date();
        d.setHours(h, m, 0, 0);
        return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
      }
    }

    const [h, m] = times[0].split(':').map(Number);
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(h, m, 0, 0);
    return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  };

  // Next Medication Dose Time Calculation
  const getNextMedDose = () => {
    const pending = todayLogs.filter((l) => l.status === 'pending');
    if (pending.length === 0) return null;
    const sorted = [...pending].sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
    const nextLog = sorted[0];
    const timePart = nextLog.scheduledTime.split(' ')[1]?.substring(0, 5) || '';
    return {
      time: formatTime(timePart),
      name: nextLog.medicationName,
    };
  };

  const nextMed = getNextMedDose();
  const nextWaterTime = getNextWaterReminderTime();

  // Next Up reminders merge (Medications + Water)
  const getNextUpList = () => {
    const list: any[] = [];

    // Add next pending medication
    const pendingMeds = todayLogs.filter((l) => l.status === 'pending');
    const sortedMeds = [...pendingMeds].sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
    if (sortedMeds.length > 0) {
      const log = sortedMeds[0];
      const timePart = log.scheduledTime.split(' ')[1]?.substring(0, 5) || '';
      list.push({
        id: `med-${log.id}`,
        type: 'medication',
        time: formatTime(timePart),
        title: log.medicationName,
        subtitle: `${log.dosage} ${translateUnit(log.unit || 'tablets', locale)}`,
        rawLog: log,
      });
    }

    // Add next water reminder
    list.push({
      id: 'water-next',
      type: 'water',
      time: nextWaterTime,
      title: locale.startsWith('pt') ? 'Beber Água' : locale.startsWith('es') ? 'Beber Agua' : 'Drink Water',
      subtitle: '200 ml',
    });

    // Sort by time
    return list.sort((a, b) => a.time.localeCompare(b.time));
  };

  const nextUpItems = getNextUpList();

  // Weekly Hydration Chart Construction
  const getWeeklyHydrationData = () => {
    const daysOfWeek = locale.startsWith('pt') 
      ? ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'] 
      : locale.startsWith('es')
      ? ['D', 'L', 'M', 'M', 'J', 'V', 'S']
      : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    const todayStr = new Date().toISOString().split('T')[0];
    const todayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday...

    // Construct last 7 days
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const dayIndex = d.getDay();

      // Find in weeklyStats
      const dayStat = weeklyStats?.days.find((x) => x.date === dateStr);
      const intake = dayStat ? dayStat.waterIntake : (dateStr === todayStr ? todayIntake : 0);

      return {
        label: daysOfWeek[dayIndex],
        intake,
        isToday: dateStr === todayStr,
      };
    });
  };

  const chartData = getWeeklyHydrationData();
  const maxIntake = Math.max(...chartData.map((d) => d.intake), 2000);
  const avgWater = weeklyStats?.averageWaterIntake || todayIntake;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.dark.background : '#F5F7FA' }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Premium Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.greeting, { color: isDark ? colors.dark.text : '#1E293B' }]}>
              {greeting}, {user?.name?.split(' ')[0] || t('friend')}! 👋
            </Text>
            <Text style={[styles.subtitle, { color: isDark ? colors.dark.textTertiary : '#64748B' }]}>
              {locale.startsWith('pt') ? 'Cuide da sua saúde hoje' : locale.startsWith('es') ? 'Cuida tu salud hoy' : 'Take care of your health today'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.bellButton, { backgroundColor: isDark ? colors.dark.surface : '#FFFFFF', borderColor: isDark ? colors.dark.border : '#E2E8F0' }]}
            onPress={() => router.push('/notification-schedule')}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={20} color={isDark ? colors.dark.primary : '#0EA5E9'} />
          </TouchableOpacity>
        </View>

        {/* Side-by-Side Circular Widgets */}
        <View style={styles.row}>
          
          {/* Water Intake circular card */}
          <View style={[styles.cardHalf, { backgroundColor: isDark ? colors.dark.surface : '#FFFFFF', borderColor: isDark ? colors.dark.border : '#E2E8F0' }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconWrapper, { backgroundColor: isDark ? 'rgba(14, 165, 233, 0.15)' : '#E0F2FE' }]}>
                <Ionicons name="water" size={16} color="#0EA5E9" />
              </View>
              <Text style={[styles.cardTitle, { color: isDark ? colors.dark.text : '#0F172A' }]}>
                {t('home.water')}
              </Text>

            </View>

            <View style={styles.circleContainer}>
              <ProgressCircle
                progress={waterProgress}
                size={110}
                strokeWidth={9}
                color="#0EA5E9"
                centerText={`${todayIntake.toLocaleString()}`}
                centerSubtext={`${locale.startsWith('pt') ? 'de' : locale.startsWith('es') ? 'de' : 'of'} ${waterGoal}ml`}
              />
            </View>

            <Text style={[styles.percentageText, { color: '#0EA5E9' }]}>
              {waterProgress}% {locale.startsWith('pt') ? 'do objetivo' : locale.startsWith('es') ? 'del objetivo' : 'of your goal'}
            </Text>

            <View style={[styles.badgeSubCard, { backgroundColor: isDark ? 'rgba(14, 165, 233, 0.1)' : '#F0F9FF' }]}>
              <View style={[styles.badgeIcon, { backgroundColor: isDark ? 'rgba(14, 165, 233, 0.2)' : '#E0F2FE' }]}>
                <Ionicons name="cafe-outline" size={14} color="#0EA5E9" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.badgeLabel} numberOfLines={1}>
                  {locale.startsWith('pt') ? 'Próximo lembrete' : locale.startsWith('es') ? 'Siguiente recordatorio' : 'Next reminder'}
                </Text>
                <Text style={[styles.badgeValue, { color: '#0EA5E9' }]}>{nextWaterTime}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.quickActionBtn, { backgroundColor: '#0EA5E9' }]}
              activeOpacity={0.7}
              onPress={async () => {
                await addWater(200);
                await loadDailyStats();
                await loadWeeklyStats();
                showInterstitial();
              }}
            >
              <Ionicons name="add" size={14} color="#FFFFFF" />
              <Text style={styles.quickActionText}>200ml</Text>
            </TouchableOpacity>
          </View>

          {/* Medications circular card */}
          <View style={[styles.cardHalf, { backgroundColor: isDark ? colors.dark.surface : '#FFFFFF', borderColor: isDark ? colors.dark.border : '#E2E8F0' }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconWrapper, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : '#F5F3FF' }]}>
                <Ionicons name="medical" size={14} color="#8B5CF6" />
              </View>
              <Text style={[styles.cardTitle, { color: isDark ? colors.dark.text : '#0F172A' }]}>
                {locale.startsWith('pt') ? 'Remédios' : locale.startsWith('es') ? 'Medicinas' : 'Meds'}
              </Text>

            </View>

            <View style={styles.circleContainer}>
              <ProgressCircle
                progress={medsProgress}
                size={110}
                strokeWidth={9}
                color="#8B5CF6"
                centerText={`${takenDoses}`}
                centerSubtext={`${takenDoses}/${totalDoses}`}
              />
            </View>

            <Text style={[styles.percentageText, { color: '#8B5CF6' }]}>
              {locale.startsWith('pt') ? 'Hoje' : locale.startsWith('es') ? 'Hoy' : 'Today'}
            </Text>

            <View style={[styles.badgeSubCard, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.1)' : '#FDF4FF' }]}>
              <View style={[styles.badgeIcon, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : '#FAE8FF' }]}>
                <Ionicons name="alarm-outline" size={14} color="#8B5CF6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.badgeLabel} numberOfLines={1}>
                  {locale.startsWith('pt') ? 'Próxima dose' : locale.startsWith('es') ? 'Siguiente dosis' : 'Next dose'}
                </Text>
                <Text style={[styles.badgeValue, { color: '#8B5CF6' }]} numberOfLines={1} adjustsFontSizeToFit>
                  {nextMed ? nextMed.time : '--'}
                </Text>
              </View>
            </View>

            {(() => {
              const nextPending = todayLogs.find((l) => l.status === 'pending');
              if (!nextPending) return null;
              return (
                <TouchableOpacity
                  style={[styles.quickActionBtn, { backgroundColor: '#8B5CF6' }]}
                  activeOpacity={0.7}
                  onPress={async () => {
                    await logStatus(nextPending.medicationId, nextPending.scheduledTime, 'taken');
                    await loadDailyStats();
                    await loadWeeklyStats();
                    showInterstitial();
                  }}
                >
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  <Text style={styles.quickActionText}>
                    {locale.startsWith('pt') ? 'Tomar' : locale.startsWith('es') ? 'Tomar' : 'Take'}
                  </Text>
                </TouchableOpacity>
              );
            })()}
          </View>

        </View>

        {/* Next Up / Lembretes Card */}
        <View style={[styles.cardFull, { backgroundColor: isDark ? colors.dark.surface : '#FFFFFF', borderColor: isDark ? colors.dark.border : '#E2E8F0' }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconWrapper, { backgroundColor: isDark ? 'rgba(76, 175, 80, 0.15)' : '#E8F5E9' }]}>
              <Ionicons name="calendar-outline" size={16} color="#4CAF50" />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.xs }}>
              <Text style={[styles.cardTitle, { color: isDark ? colors.dark.text : '#0F172A' }]}>
                {locale.startsWith('pt') ? 'Próximos Lembretes' : locale.startsWith('es') ? 'Siguientes Recordatorios' : 'Next Up'}
              </Text>
              <Text style={{ fontSize: fontSize.xs, color: '#94A3B8' }}>
                {locale.startsWith('pt') ? 'Seus próximos lembretes' : locale.startsWith('es') ? 'Tus próximos recordatorios' : 'Your upcoming reminders'}
              </Text>
            </View>
            <TouchableOpacity activeOpacity={0.6}>
              <Ionicons name="ellipsis-horizontal" size={16} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: spacing.md, gap: spacing.md }}>
            {nextUpItems.map((item, index) => {
              const isMed = item.type === 'medication';
              const themeColor = isMed ? '#8B5CF6' : '#0EA5E9';
              const badgeBg = isMed 
                ? (isDark ? 'rgba(139, 92, 246, 0.15)' : '#F5F3FF') 
                : (isDark ? 'rgba(14, 165, 233, 0.15)' : '#E0F2FE');

              return (
                <View key={item.id} style={styles.reminderRow}>
                  {/* Left Time Label */}
                  <View style={[styles.timeBox, { backgroundColor: badgeBg }]}>
                    <Text style={[styles.timeText, { color: themeColor }]}>{item.time}</Text>
                  </View>

                  {/* Middle Info */}
                  <View style={styles.reminderInfo}>
                    <View style={[styles.badgeIcon, { backgroundColor: badgeBg, marginRight: spacing.sm }]}>
                      <Ionicons name={isMed ? 'medical' : 'water'} size={14} color={themeColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.reminderTitle, { color: isDark ? colors.dark.text : '#1E293B' }]} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={{ fontSize: fontSize.sm, color: '#94A3B8' }}>{item.subtitle}</Text>
                    </View>
                  </View>

                  {/* Right Action Button */}
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: isMed ? '#F5F3FF' : '#E0F2FE' }]}
                    activeOpacity={0.7}
                    onPress={async () => {
                      if (isMed) {
                        await logStatus(item.rawLog.medicationId, item.rawLog.scheduledTime, 'taken');
                      } else {
                        await addWater(200);
                      }
                      await loadDailyStats();
                      await loadWeeklyStats();
                      showInterstitial();
                    }}
                  >
                    <Text style={[styles.actionButtonText, { color: themeColor }]}>
                      {isMed 
                        ? (locale.startsWith('pt') ? 'Tomar' : locale.startsWith('es') ? 'Tomar' : 'Take') 
                        : (locale.startsWith('pt') ? 'Registrar' : locale.startsWith('es') ? 'Registrar' : 'Log')
                      }
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

        {/* Bottom Side-by-Side Widgets */}
        <View style={styles.row}>

          {/* Today's Summary card */}
          <View style={[styles.cardHalf, { backgroundColor: isDark ? colors.dark.surface : '#FFFFFF', borderColor: isDark ? colors.dark.border : '#E2E8F0' }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconWrapper, { backgroundColor: isDark ? 'rgba(26, 188, 156, 0.15)' : '#E8F8F5' }]}>
                <Ionicons name="bar-chart-outline" size={16} color="#1ABC9C" />
              </View>
              <Text style={[styles.cardTitle, { color: isDark ? colors.dark.text : '#0F172A' }]}>
                {locale.startsWith('pt') ? 'Resumo de Hoje' : locale.startsWith('es') ? 'Resumen de Hoy' : "Today's Summary"}
              </Text>

            </View>

            <View style={styles.summaryList}>
              <View style={styles.summaryItem}>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                <Text style={[styles.summaryLabel, { color: isDark ? colors.dark.textSecondary : '#64748B' }]}>
                  {locale.startsWith('pt') ? 'Medicamentos tomados' : locale.startsWith('es') ? 'Medicamentos tomados' : 'Medications taken'}
                </Text>
                <Text style={[styles.summaryValue, { color: isDark ? colors.dark.text : '#0F172A' }]}>{takenDoses}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name="time" size={18} color="#F59E0B" />
                <Text style={[styles.summaryLabel, { color: isDark ? colors.dark.textSecondary : '#64748B' }]}>
                  {locale.startsWith('pt') ? 'Pendentes' : locale.startsWith('es') ? 'Pendientes' : 'Pending'}
                </Text>
                <Text style={[styles.summaryValue, { color: isDark ? colors.dark.text : '#0F172A' }]}>{pendingDoses}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name="close-circle" size={18} color="#EF4444" />
                <Text style={[styles.summaryLabel, { color: isDark ? colors.dark.textSecondary : '#64748B' }]}>
                  {locale.startsWith('pt') ? 'Pulados' : locale.startsWith('es') ? 'Omitidos' : 'Skipped'}
                </Text>
                <Text style={[styles.summaryValue, { color: isDark ? colors.dark.text : '#0F172A' }]}>{skippedDoses}</Text>
              </View>
            </View>
          </View>

          {/* Hydration Progress chart card */}
          <View style={[styles.cardHalf, { backgroundColor: isDark ? colors.dark.surface : '#FFFFFF', borderColor: isDark ? colors.dark.border : '#E2E8F0' }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconWrapper, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#E0F2FE' }]}>
                <Ionicons name="water-outline" size={16} color="#3B82F6" />
              </View>
              <Text style={[styles.cardTitle, { color: isDark ? colors.dark.text : '#0F172A' }]}>
                {locale.startsWith('pt') ? 'Progresso de Hidratação' : locale.startsWith('es') ? 'Progreso de Hidratación' : 'Hydration Progress'}
              </Text>

            </View>

            <Text style={styles.avgWaterText}>
              {locale.startsWith('pt') ? 'Média: ' : locale.startsWith('es') ? 'Media: ' : 'Avg: '}
              {avgWater.toLocaleString()} ml
            </Text>

            {/* Custom Bar Chart */}
            <View style={styles.chartContainer}>
              {chartData.map((day, idx) => {
                const heightPercent = maxIntake > 0 ? (day.intake / maxIntake) * 100 : 0;
                return (
                  <View key={idx} style={styles.chartBarWrapper}>
                    <View style={[styles.chartBarBackground, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}>
                      <View 
                        style={[
                          styles.chartBarFill, 
                          { 
                            height: `${Math.min(heightPercent, 100)}%`,
                            backgroundColor: day.isToday ? '#2563EB' : '#93C5FD' 
                          }
                        ]} 
                      />
                    </View>
                    <Text style={[styles.chartBarLabel, { color: day.isToday ? '#2563EB' : '#94A3B8' }]}>
                      {day.label}
                    </Text>
                  </View>
                );
              })}
            </View>

            <Text style={styles.chartFooterText}>
              {locale.startsWith('pt') ? 'Ótimo trabalho! Continue assim! 💧' : locale.startsWith('es') ? '¡Buen trabajo! ¡Sigue así! 💧' : 'Great job! Keep it up! 💧'}
            </Text>
          </View>

        </View>

        {/* Health Tip Card */}
        <View style={[styles.cardFull, styles.healthTipCard, { backgroundColor: isDark ? colors.dark.surface : '#EFF6FF', borderColor: isDark ? colors.dark.border : '#DBEAFE' }]}>
          <View style={[styles.iconWrapper, { backgroundColor: '#3B82F6', marginRight: spacing.md, alignSelf: 'flex-start' }]}>
            <Ionicons name="heart" size={18} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1, paddingRight: spacing.sm }}>
            <Text style={[styles.healthTipTitle, { color: isDark ? colors.dark.text : '#1E3A8A' }]}>
              {locale.startsWith('pt') ? 'Dica de Saúde' : locale.startsWith('es') ? 'Consejo de Salud' : 'Health Tip'}
            </Text>
            <Text style={[styles.healthTipDesc, { color: isDark ? colors.dark.textSecondary : '#1E40AF' }]}>
              {locale.startsWith('pt') ? 'Manter-se hidratado ajuda a melhorar o humor, energia e saúde geral.' : locale.startsWith('es') ? 'Mantenerse hidratado ayuda a mejorar el estado de ánimo, la energía y la salud general.' : 'Staying hydrated helps improve your mood, energy, and overall health.'}
            </Text>
          </View>
          <View style={styles.illustrationWrapper}>
            <WaterBottleIllustration />
          </View>
        </View>

      </ScrollView>
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
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 10 : 20,
    marginBottom: spacing.xs,
  },
  greeting: { 
    fontSize: fontSize.xl, 
    fontWeight: fontWeight.bold,
  },
  subtitle: { 
    fontSize: fontSize.sm, 
    marginTop: 2,
  },
  bellButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  bellBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cardHalf: {
    flex: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardFull: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
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
    flex: 1,
    marginLeft: spacing.xs,
  },
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
  },
  percentageText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  badgeSubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    padding: 8,
    gap: spacing.xs,
  },
  badgeIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLabel: {
    fontSize: fontSize.xs,
    color: '#94A3B8',
    fontWeight: fontWeight.medium,
  },
  badgeValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  timeBox: {
    borderRadius: borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 65,
    alignItems: 'center',
  },
  timeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  reminderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  actionButton: {
    borderRadius: borderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionButtonText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  summaryList: {
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    flex: 1,
  },
  summaryValue: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  avgWaterText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: '#3B82F6',
    textAlign: 'right',
    marginTop: -spacing.xs,
    marginBottom: spacing.xs,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 70,
    marginVertical: spacing.xs,
  },
  chartBarWrapper: {
    alignItems: 'center',
    width: '12%',
  },
  chartBarBackground: {
    height: 50,
    width: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBarFill: {
    width: '100%',
    borderRadius: 3,
  },
  chartBarLabel: {
    fontSize: fontSize.xxs,
    marginTop: 4,
    fontWeight: fontWeight.bold,
  },
  chartFooterText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: '#3B82F6',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  healthTipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  healthTipTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    marginBottom: 2,
  },
  healthTipDesc: {
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
  illustrationWrapper: {
    width: 60,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: spacing.sm,
    gap: 4,
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
});
