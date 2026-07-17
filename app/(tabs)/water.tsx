import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Platform, Alert, TextInput, Modal } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useWaterStore } from '@/stores/useWaterStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useIsDark, useSettingsStore } from '@/stores/useSettingsStore';
import { useStatsStore } from '@/stores/useStatsStore';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/lib/theme';
import { useTranslation } from '@/i18n';
import { useInterstitial } from '@/components/InterstitialAdManager';
import { distributeWaterReminders } from '@/lib/utils';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, Path, Circle, Polygon, Defs, ClipPath, Ellipse } from 'react-native-svg';
import { ProgressCircle } from '@/components/ProgressCircle';

// Custom Mascot Illustration
function CuteMascotDrop() {
  return (
    <Svg width={46} height={46} viewBox="0 0 50 50">
      {/* Shadow */}
      <Ellipse cx={25} cy={44} rx={12} ry={2} fill="rgba(0,0,0,0.06)" />
      {/* Water drop body */}
      <Path
        d="M 25 6 C 25 6, 37 20, 37 32 C 37 38.6, 31.6 44, 25 44 C 18.4 44, 13 38.6, 13 32 C 13 20, 25 6, 25 6 Z"
        fill="#3B82F6"
      />
      {/* Eyes */}
      <Circle cx="21" cy="29" r="2" fill="#000000" />
      <Circle cx="29" cy="29" r="2" fill="#000000" />
      <Circle cx="20.3" cy="28.3" r="0.6" fill="#FFFFFF" />
      <Circle cx="28.3" cy="28.3" r="0.6" fill="#FFFFFF" />
      {/* Smile */}
      <Path d="M 23 33 Q 25 35 27 33" stroke="#000000" strokeWidth={1.2} strokeLinecap="round" fill="none" />
      {/* Rosy Cheeks */}
      <Circle cx="17" cy="32" r="1.5" fill="#F472B6" opacity={0.6} />
      <Circle cx="33" cy="32" r="1.5" fill="#F472B6" opacity={0.6} />
      {/* Cup held */}
      <Polygon points="33,31 38,31 37,39 34,39" fill="#93C5FD" stroke="#3B82F6" strokeWidth={0.8} />
      <Rect x="34.2" y="33" width="2.5" height="5" fill="#2563EB" />
    </Svg>
  );
}

// Cup SVG representing progressive volume levels
function GlassSVG({ fillLevel }: { fillLevel: number }) {
  const height = 28;
  const fillHeight = fillLevel * height;
  const fillY = 43 - fillHeight;

  return (
    <Svg width={30} height={46} viewBox="0 0 30 46">
      <Defs>
        <ClipPath id="glassClip">
          <Polygon points="6,15 24,15 20,43 10,43" />
        </ClipPath>
      </Defs>
      {/* Glass Outline */}
      <Polygon
        points="6,15 24,15 20,43 10,43"
        fill="rgba(219, 234, 254, 0.2)"
        stroke="#93C5FD"
        strokeWidth={1.5}
      />
      {/* Water fill */}
      <Rect
        x="2"
        y={fillY}
        width="26"
        height={fillHeight}
        fill="#3B82F6"
        clipPath="url(#glassClip)"
      />
      {/* Reflection */}
      <Path
        d="M 9 18 L 11 40"
        stroke="#FFFFFF"
        strokeWidth={1.2}
        opacity={0.5}
        clipPath="url(#glassClip)"
      />
    </Svg>
  );
}

// Bottle SVG which fills dynamically according to percentage progress
function DynamicWaterBottle({ progress }: { progress: number }) {
  const clamped = Math.min(Math.max(progress, 0), 1);
  const fillHeight = clamped * 50;
  const fillY = 80 - fillHeight;

  return (
    <Svg width={54} height={80} viewBox="0 0 60 90">
      {/* Shadow */}
      <Ellipse cx={30} cy={84} rx={14} ry={3} fill="rgba(0,0,0,0.06)" />
      {/* Bottle Cap */}
      <Rect x="23" y="10" width="14" height="6" rx={2} fill="#2563EB" />
      {/* Neck */}
      <Rect x="25" y="16" width="10" height="10" fill="#DBEAFE" />
      {/* Bottle body base */}
      <Path
        d="M 20 26 C 20 26, 12 30, 12 38 L 12 76 C 12 80, 16 80, 20 80 L 40 80 C 44 80, 48 80, 48 76 L 48 38 C 48 30, 40 26, 40 26 Z"
        fill="#EFF6FF"
        stroke="#93C5FD"
        strokeWidth={2}
      />
      <Defs>
        <ClipPath id="bottleClip">
          <Path d="M 20 26 C 20 26, 12 30, 12 38 L 12 76 C 12 80, 16 80, 20 80 L 40 80 C 44 80, 48 80, 48 76 L 48 38 C 48 30, 40 26, 40 26 Z" />
        </ClipPath>
      </Defs>
      {/* Water layer fill */}
      <Rect
        x="10"
        y={fillY}
        width="40"
        height={fillHeight}
        fill="#3B82F6"
        clipPath="url(#bottleClip)"
      />
      {/* Highlights */}
      <Path d="M 18 36 L 18 74" stroke="#FFFFFF" strokeWidth={1.5} strokeLinecap="round" opacity={0.5} clipPath="url(#bottleClip)" />
    </Svg>
  );
}

// Mini Progress Ring for Weekly Overview
function MiniProgressCircle({ progress, isGoalMet, isDark }: { progress: number; isGoalMet: boolean; isDark: boolean }) {
  const size = 22;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - Math.min(progress, 1) * circumference;
  const color = isGoalMet ? '#10B981' : '#3B82F6';

  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={isDark ? '#334155' : '#E2E8F0'}
        strokeWidth={strokeWidth}
        fill="none"
      />
      {progress > 0 && (
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      )}
    </Svg>
  );
}

export default function WaterScreen() {
  const { showInterstitial } = useInterstitial();
  const { todayIntake, todayLogs, loadToday, addWater, undoLastWater, getWeeklyAverage } = useWaterStore();
  const { user, saveUser } = useAuthStore();
  const { notificationsEnabled, setNotificationsEnabled } = useSettingsStore();
  const { weeklyStats, loadDailyStats, loadWeeklyStats } = useStatsStore();
  const isDark = useIsDark();
  const { t, locale } = useTranslation();

  const [showCustom, setShowCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [weeklyAvg, setWeeklyAvg] = useState(0);

  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [newGoalInput, setNewGoalInput] = useState('');

  useFocusEffect(
    useCallback(() => {
      async function syncData() {
        await loadToday();
        const avg = await getWeeklyAverage();
        setWeeklyAvg(avg);
        await loadDailyStats();
        await loadWeeklyStats();
      }
      syncData();
    }, [])
  );

  const goal = user?.waterGoal || 2000;
  const progressPercent = Math.round((todayIntake / goal) * 100);
  const remaining = Math.max(goal - todayIntake, 0);

  const handleCustomAdd = () => {
    const amount = parseInt(customAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert(t('water.invalidAmount'), t('water.invalidAmountMsg'));
      return;
    }
    addWater(amount);
    setCustomAmount('');
    setShowCustom(false);
    loadDailyStats();
    loadWeeklyStats();
    showInterstitial();
  };

  const handleSaveGoal = async () => {
    const newGoalVal = parseInt(newGoalInput);
    if (isNaN(newGoalVal) || newGoalVal <= 0) {
      Alert.alert(t('common.error'), t('water.invalidAmountMsg'));
      return;
    }
    await saveUser({ waterGoal: newGoalVal });
    setIsEditingGoal(false);
    loadDailyStats();
  };

  // Next water reminder time based on scheduled notification times
  const getNextWaterTime = () => {
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

  const nextWaterTimeStr = getNextWaterTime();

  // Next reminder countdown calculation
  const getCountdownText = () => {
    if (todayLogs.length === 0) {
      return locale.startsWith('pt') ? 'Próximo às 10:30' : 'Next at 10:30 AM';
    }
    try {
      const [time, period] = nextWaterTimeStr.split(' ');
      let [hrs, mins] = time.split(':').map(Number);
      if (period === 'PM' && hrs < 12) hrs += 12;
      if (period === 'AM' && hrs === 12) hrs = 0;

      const nextDate = new Date();
      nextDate.setHours(hrs, mins, 0, 0);

      if (nextDate <= new Date()) nextDate.setDate(nextDate.getDate() + 1);

      const diffMs = nextDate.getTime() - new Date().getTime();
      const diffMins = Math.round(diffMs / (60 * 1000));

      if (diffMins <= 0) return '';
      const h = Math.floor(diffMins / 60);
      const m = diffMins % 60;

      if (h > 0) {
        return locale.startsWith('pt') 
          ? `Próximo lembrete em ${h}h ${m}m • ${nextWaterTimeStr}`
          : `Next reminder in ${h}h ${m}m • ${nextWaterTimeStr}`;
      }
      return locale.startsWith('pt')
        ? `Próximo lembrete em ${m}m • ${nextWaterTimeStr}`
        : `Next reminder in ${m}m • ${nextWaterTimeStr}`;
    } catch {
      return locale.startsWith('pt') ? `Próximo lembrete às ${nextWaterTimeStr}` : `Next reminder at ${nextWaterTimeStr}`;
    }
  };

  // Hourly intake graph distribution
  const getHourlyGraphData = () => {
    const buckets = [
      { label: '6 AM', start: 5, end: 6 },
      { label: '8 AM', start: 7, end: 8 },
      { label: '10 AM', start: 9, end: 10 },
      { label: '12 PM', start: 11, end: 12 },
      { label: '2 PM', start: 13, end: 14 },
      { label: '4 PM', start: 15, end: 16 },
      { label: '6 PM', start: 17, end: 18 },
      { label: '8 PM', start: 19, end: 20 },
      { label: '10 PM', start: 21, end: 22 },
    ];

    return buckets.map((b) => {
      const sum = todayLogs.reduce((acc, log) => {
        const h = new Date(log.createdAt).getHours();
        if (h >= b.start && h <= b.end) {
          return acc + log.amount;
        }
        return acc;
      }, 0);

      return {
        label: b.label,
        amount: sum,
      };
    });
  };

  const graphData = getHourlyGraphData();
  const maxGraphIntake = Math.max(...graphData.map((d) => d.amount), 250);

  // Weekly Overview items
  const getWeeklyOverview = () => {
    const daysOfWeek = locale.startsWith('pt') 
      ? ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'] 
      : locale.startsWith('es')
      ? ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const todayStr = new Date().toISOString().split('T')[0];

    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      // Monday start (weekStartsOn: 1)
      const currentDay = d.getDay();
      const distance = (currentDay === 0 ? 6 : currentDay - 1) - i;
      d.setDate(d.getDate() - distance);

      const dateStr = d.toISOString().split('T')[0];
      const isFuture = d > new Date() && dateStr !== todayStr;

      // Find in weeklyStats
      const stats = weeklyStats?.days.find((x) => x.date === dateStr);
      const intake = stats ? stats.waterIntake : (dateStr === todayStr ? todayIntake : 0);
      const dayGoal = stats ? stats.waterGoal : goal;

      return {
        label: daysOfWeek[i],
        intake,
        goal: dayGoal,
        isFuture,
        isToday: dateStr === todayStr,
      };
    });
  };

  const weeklyOverviewData = getWeeklyOverview();
  const avgWater = weeklyAvg || todayIntake;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.dark.background : '#F5F7FA' }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Premium Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: isDark ? colors.dark.text : '#1E293B' }]}>
              {locale.startsWith('pt') ? 'Água' : locale.startsWith('es') ? 'Agua' : 'Water'} 💧
            </Text>
            <Text style={[styles.subtitle, { color: isDark ? colors.dark.textTertiary : '#64748B' }]}>
              {locale.startsWith('pt') ? 'Mantenha-se hidratado, mantenha-se saudável 💙' : locale.startsWith('es') ? 'Mantente hidratado, mantente saludable 💙' : 'Stay hydrated, stay healthy 💙'}
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

        {/* Today's Progress circular bottle widget */}
        <View style={[styles.cardFull, { backgroundColor: isDark ? colors.dark.surface : '#FFFFFF', borderColor: isDark ? colors.dark.border : '#E2E8F0' }]}>
          <View style={styles.bottleWidgetRow}>
            {/* Left Info */}
            <View style={{ flex: 1.2, gap: spacing.xs }}>
              <Text style={[styles.widgetLabel, { color: isDark ? colors.dark.textSecondary : '#64748B' }]}>
                {locale.startsWith('pt') ? 'Progresso de Hoje' : locale.startsWith('es') ? 'Progreso de Hoy' : "Today's Progress"}
              </Text>
              <Text style={[styles.widgetValue, { color: isDark ? colors.dark.text : '#0F172A' }]}>
                {todayIntake.toLocaleString()} ml
              </Text>
              <Text style={[styles.widgetGoal, { color: isDark ? colors.dark.textTertiary : '#94A3B8' }]}>
                {locale.startsWith('pt') ? `de ${goal.toLocaleString()} ml objetivo` : `of ${goal.toLocaleString()} ml goal`}
              </Text>

              <View style={styles.badgeLabel}>
                <Text style={styles.badgeText}>{progressPercent}% {locale.startsWith('pt') ? 'do objetivo' : 'of your goal'}</Text>
              </View>
            </View>

            {/* Center Bottle */}
            <View style={styles.bottleCircleContainer}>
              <ProgressCircle
                progress={progressPercent}
                size={120}
                strokeWidth={9}
                color="#3B82F6"
              >
                <DynamicWaterBottle progress={todayIntake / goal} />
              </ProgressCircle>
            </View>

            {/* Right statistics */}
            <View style={styles.widgetStatsCol}>
              <View style={[styles.statBox, { borderBottomWidth: 1, borderBottomColor: isDark ? colors.dark.border : '#F1F5F9' }]}>
                <Text style={styles.statLabel}>
                  {locale.startsWith('pt') ? 'Meta Diária' : locale.startsWith('es') ? 'Meta Diaria' : 'Daily Goal'}
                </Text>
                
                <>
                  <Text style={[styles.statValue, { color: isDark ? colors.dark.text : '#1E293B' }]}>
                    {goal.toLocaleString()} ml
                  </Text>
                  <TouchableOpacity onPress={() => { setNewGoalInput(String(goal)); setIsEditingGoal(true); }} style={styles.editGoalBtn}>
                    <Text style={styles.editGoalText}>
                      {locale.startsWith('pt') ? 'Editar Meta' : 'Edit Goal'}
                    </Text>
                    <Ionicons name="create-outline" size={10} color="#3B82F6" />
                  </TouchableOpacity>
                </>
              </View>

              <View style={[styles.statBox, { paddingTop: 6 }]}>
                <Text style={styles.statLabel}>
                  {locale.startsWith('pt') ? 'Restante' : locale.startsWith('es') ? 'Restante' : 'Remaining'}
                </Text>
                <Text style={[styles.statValue, { color: '#3B82F6' }]}>
                  {remaining.toLocaleString()} ml
                </Text>
                <Text style={styles.statSub}>
                  {locale.startsWith('pt') ? 'Até o objetivo' : 'Until goal reached'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Add Cups */}
        <View style={[styles.cardFull, { backgroundColor: isDark ? colors.dark.surface : '#FFFFFF', borderColor: isDark ? colors.dark.border : '#E2E8F0' }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: isDark ? colors.dark.text : '#0F172A' }]}>
              {locale.startsWith('pt') ? 'Adição Rápida' : 'Quick Add'}
            </Text>
            {todayLogs.length > 0 && (
              <TouchableOpacity
                onPress={async () => {
                  await undoLastWater();
                  await loadDailyStats();
                  await loadWeeklyStats();
                }}
                activeOpacity={0.7}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
              >
                <Ionicons name="arrow-undo" size={14} color="#F59E0B" />
                <Text style={{ fontSize: fontSize.xs, color: '#F59E0B', fontWeight: '600' }}>
                  {locale.startsWith('pt') ? 'Desfazer' : locale.startsWith('es') ? 'Deshacer' : 'Undo'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              activeOpacity={0.7} 
              onPress={() => setShowCustom(!showCustom)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Text style={{ fontSize: fontSize.xs, color: '#3B82F6', fontWeight: 'bold' }}>
                {locale.startsWith('pt') ? 'Valor Personalizado' : 'Custom Amount'}
              </Text>
              <Ionicons name="pencil" size={11} color="#3B82F6" />
            </TouchableOpacity>
          </View>

          {showCustom ? (
            <View style={styles.customAmountContainer}>
              <TextInput
                placeholder={t('water.customPlaceholder')}
                keyboardType="numeric"
                value={customAmount}
                onChangeText={setCustomAmount}
                style={[styles.customInput, { color: isDark ? colors.dark.text : '#000', borderColor: isDark ? '#475569' : '#CBD5E1' }]}
              />
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <TouchableOpacity onPress={() => { setShowCustom(false); setCustomAmount(''); }} style={[styles.btnAction, styles.btnCancel]}>
                  <Text style={styles.btnActionTextCancel}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCustomAdd} style={[styles.btnAction, styles.btnAdd]}>
                  <Text style={styles.btnActionTextAdd}>{t('common.add')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.quickAddGrid}>
              {[
                { amount: 100, fill: 0.2 },
                { amount: 250, fill: 0.4 },
                { amount: 500, fill: 0.65 },
                { amount: 1000, fill: 1.0 },
              ].map((item) => (
                <TouchableOpacity
                  key={item.amount}
                  style={[styles.quickAddBtn, { backgroundColor: isDark ? colors.dark.surfaceSecondary : '#F8FAFC', borderColor: isDark ? colors.dark.border : '#E2E8F0' }]}
                  onPress={async () => {
                    await addWater(item.amount);
                    await loadDailyStats();
                    await loadWeeklyStats();
                    showInterstitial();
                  }}
                  activeOpacity={0.7}
                >
                  <GlassSVG fillLevel={item.fill} />
                  <Text style={[styles.quickAddAmountText, { color: isDark ? colors.dark.text : '#1E293B' }]}>
                    +{item.amount} ml
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Hydration Reminders switch panel */}
        <View style={[styles.cardFull, { backgroundColor: isDark ? colors.dark.surface : '#FFFFFF', borderColor: isDark ? colors.dark.border : '#E2E8F0' }]}>
          <View style={styles.reminderHeader}>
            <View style={styles.reminderTitleBox}>
              <View style={[styles.iconWrapper, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="notifications" size={16} color="#3B82F6" />
              </View>
              <Text style={[styles.cardTitle, { color: isDark ? colors.dark.text : '#0F172A', marginLeft: spacing.xs }]}>
                {locale.startsWith('pt') ? 'Lembretes de Hidratação' : 'Hydration Reminders'}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setNotificationsEnabled(!notificationsEnabled)}
                style={[styles.switchTrack, { backgroundColor: notificationsEnabled ? '#10B981' : '#CBD5E1' }]}
              >
                <View style={[styles.switchThumb, { alignSelf: notificationsEnabled ? 'flex-end' : 'flex-start' }]} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.reminderSubCard, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#F0F9FF' }]}>
            <View style={[styles.badgeIcon, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#E0F2FE' }]}>
              <Ionicons name="water" size={14} color="#3B82F6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.reminderSubCardLabel, { color: isDark ? colors.dark.textSecondary : '#64748B' }]}>
                {locale.startsWith('pt') ? 'Lembramos você de beber água ao longo do dia.' : 'We\'ll remind you to drink water throughout the day'}
              </Text>
              <Text style={[styles.reminderSubCardTime, { color: '#3B82F6' }]}>
                {notificationsEnabled ? getCountdownText() : (locale.startsWith('pt') ? 'Notificações Desativadas' : 'Notifications Off')}
              </Text>
            </View>
          </View>
        </View>

        {/* Hourly Intake Graph */}
        <View style={[styles.cardFull, { backgroundColor: isDark ? colors.dark.surface : '#FFFFFF', borderColor: isDark ? colors.dark.border : '#E2E8F0' }]}>
          <View style={styles.cardHeader}>
            <View style={styles.reminderTitleBox}>
              <View style={[styles.iconWrapper, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="water" size={16} color="#3B82F6" />
              </View>
              <Text style={[styles.cardTitle, { color: isDark ? colors.dark.text : '#0F172A', marginLeft: spacing.xs }]}>
                {locale.startsWith('pt') ? 'Consumo de Hoje' : 'Today\'s Intake'}
              </Text>
            </View>
              <Text style={{ fontSize: fontSize.sm, fontWeight: 'bold', color: '#3B82F6' }}>
              {todayIntake.toLocaleString()} ml
            </Text>
          </View>

          {/* Linear hourly bars */}
          <View style={styles.intakeChartContainer}>
            {graphData.map((d, idx) => {
              const heightPercent = maxGraphIntake > 0 ? (d.amount / maxGraphIntake) * 100 : 0;
              const hasIntake = d.amount > 0;

              return (
                <View key={idx} style={styles.intakeChartBarWrapper}>
                  {hasIntake ? (
                    <Text style={styles.intakeBarVal}>{d.amount}</Text>
                  ) : (
                    <Text style={[styles.intakeBarVal, { opacity: 0 }]}>-</Text>
                  )}
                  
                  {hasIntake ? (
                    <View style={[styles.intakeChartBarBackground, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}>
                      <View style={[styles.intakeChartBarFill, { height: `${heightPercent}%`, backgroundColor: '#3B82F6' }]} />
                    </View>
                  ) : (
                    // Outline transparent cup element in place of empty bars
                    <View style={styles.emptyCupOutline}>
                      <Polygon points="2,8 10,8 9,22 3,22" stroke="#CBD5E1" strokeWidth={1.2} fill="none" strokeDasharray="2,2" />
                    </View>
                  )}

                  <Text style={[styles.intakeChartBarLabel, { color: hasIntake ? '#3B82F6' : '#94A3B8' }]}>
                    {d.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Weekly circular rings Overview */}
        <View style={[styles.cardFull, { backgroundColor: isDark ? colors.dark.surface : '#FFFFFF', borderColor: isDark ? colors.dark.border : '#E2E8F0' }]}>
          <View style={styles.cardHeader}>
            <View style={styles.reminderTitleBox}>
              <View style={[styles.iconWrapper, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="calendar" size={16} color="#4F46E5" />
              </View>
              <Text style={[styles.cardTitle, { color: isDark ? colors.dark.text : '#0F172A', marginLeft: spacing.xs }]}>
                {locale.startsWith('pt') ? 'Visão Geral da Semana' : 'Weekly Overview'}
              </Text>
            </View>
            <Text style={{ fontSize: fontSize.xs, fontWeight: 'bold', color: '#4F46E5' }}>
              {locale.startsWith('pt') ? `Média: ${avgWater.toLocaleString()} ml` : `Average: ${avgWater.toLocaleString()} ml`}
            </Text>
          </View>

          <View style={styles.weeklyOverviewRow}>
            {weeklyOverviewData.map((day, idx) => {
              const dayProgress = day.isFuture ? 0 : (day.intake / day.goal);
              const isGoalMet = day.intake >= day.goal;

              return (
                <View key={idx} style={styles.weeklyOverviewCol}>
                  <Text style={[styles.weeklyDayLabel, { color: day.isToday ? '#4F46E5' : '#94A3B8' }]}>
                    {day.label}
                  </Text>
                  <Text style={styles.weeklyAmountText}>
                    {day.isFuture ? '—' : `${(day.intake / 1000).toFixed(1)}l`}
                  </Text>
                  <MiniProgressCircle progress={dayProgress} isGoalMet={isGoalMet} isDark={isDark} />
                </View>
              );
            })}
          </View>
        </View>

        {/* Motivacional Mascot Banner */}
        <View style={[styles.cardFull, styles.mascotBanner, { backgroundColor: isDark ? colors.dark.surface : '#EFF6FF', borderColor: isDark ? colors.dark.border : '#DBEAFE' }]}>
          <CuteMascotDrop />
          <View style={{ flex: 1, marginLeft: spacing.xs }}>
            <Text style={[styles.mascotTitle, { color: isDark ? colors.dark.text : '#1E3A8A' }]}>
              {locale.startsWith('pt') ? 'Ótimo trabalho! 💧' : 'Great job! 💧'}
            </Text>
            <Text style={[styles.mascotDesc, { color: isDark ? colors.dark.textSecondary : '#1E40AF' }]}>
              {locale.startsWith('pt') ? 'Você está no caminho certo para atingir sua meta.' : 'You\'re on the right track to reach your daily goal.'}
            </Text>
          </View>
          <TouchableOpacity 
            onPress={() => router.push('/statistics')} 
            style={[styles.insightsBtn, { backgroundColor: '#3B82F6' }]}
            activeOpacity={0.8}
          >
            <Ionicons name="analytics" size={13} color="#FFFFFF" />
            <Text style={styles.insightsBtnText}>
              {locale.startsWith('pt') ? 'Estatísticas' : 'View Insights'}
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Edit Water Goal Modal */}
      <Modal
        visible={isEditingGoal}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditingGoal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? colors.dark.surface : colors.light.surface }]}>
            <Text style={[styles.modalTitle, { color: isDark ? colors.dark.text : colors.light.text }]}>
              💧 {locale.startsWith('pt') ? 'Editar Meta' : 'Edit Goal'}
            </Text>
            <TextInput
              value={newGoalInput}
              onChangeText={setNewGoalInput}
              keyboardType="numeric"
              autoFocus
              style={[styles.modalInput, {
                color: isDark ? colors.dark.text : colors.light.text,
                backgroundColor: isDark ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
                borderColor: isDark ? colors.dark.border : colors.light.border,
              }]}
            />
            <View style={styles.modalPresets}>
              {[1500, 2000, 2500, 3000, 3500].map((preset) => (
                <TouchableOpacity
                  key={preset}
                  onPress={() => setNewGoalInput(String(preset))}
                  style={[styles.presetBtn, {
                    backgroundColor: parseInt(newGoalInput) === preset
                      ? (isDark ? colors.dark.primaryLight : colors.light.primaryLight)
                      : (isDark ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary),
                    borderColor: parseInt(newGoalInput) === preset
                      ? colors.light.primary
                      : (isDark ? colors.dark.border : colors.light.border),
                  }]}
                >
                  <Text style={{
                    fontSize: fontSize.sm,
                    fontWeight: parseInt(newGoalInput) === preset ? 'bold' : '500',
                    color: parseInt(newGoalInput) === preset
                      ? colors.light.primary
                      : (isDark ? colors.dark.text : colors.light.text),
                  }}>
                    {preset}ml
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setIsEditingGoal(false)}
                style={[styles.modalBtn, { backgroundColor: isDark ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary }]}
              >
                <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: isDark ? colors.dark.textSecondary : colors.light.textSecondary }}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveGoal}
                style={[styles.modalBtn, { backgroundColor: colors.light.primary }]}
              >
                <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: '#FFFFFF' }}>
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
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 10 : 20,
    marginBottom: spacing.xs,
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
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  cardTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  bottleWidgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  widgetLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  widgetValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginTop: 2,
  },
  widgetGoal: {
    fontSize: fontSize.xs,
    marginTop: -2,
  },
  badgeLabel: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
  },
  badgeText: {
    fontSize: fontSize.xxs,
    color: '#0EA5E9',
    fontWeight: fontWeight.bold,
  },
  bottleCircleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  widgetStatsCol: {
    flex: 1,
    gap: spacing.xs,
  },
  statBox: {
    flex: 1,
    gap: 2,
  },
  statLabel: {
    fontSize: fontSize.xxs,
    color: '#94A3B8',
    fontWeight: fontWeight.bold,
  },
  statValue: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  statSub: {
    fontSize: fontSize.xxs,
    color: '#94A3B8',
  },
  editGoalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  editGoalText: {
    fontSize: fontSize.xxs,
    color: '#3B82F6',
    fontWeight: fontWeight.bold,
  },
  goalInput: {
    fontSize: fontSize.xs,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    width: 60,
  },
  miniSaveBtn: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  miniCancelBtn: {
    backgroundColor: '#64748B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  miniBtnText: {
    fontSize: fontSize.xxs,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  quickAddGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickAddBtn: {
    flex: 1,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    gap: spacing.xs,
  },
  quickAddAmountText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  customAmountContainer: {
    gap: spacing.sm,
  },
  customInput: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: fontSize.sm,
  },
  btnAction: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  btnCancel: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  btnActionTextCancel: {
    fontSize: fontSize.sm,
    color: '#64748B',
    fontWeight: 'bold',
  },
  btnAdd: {
    backgroundColor: '#3B82F6',
  },
  btnActionTextAdd: {
    fontSize: fontSize.sm,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  reminderTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchTrack: {
    width: 42,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  switchThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
  },
  reminderSubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  badgeIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderSubCardLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  reminderSubCardTime: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    marginTop: 2,
  },
  intakeChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 85,
    marginTop: spacing.xs,
  },
  intakeChartBarWrapper: {
    alignItems: 'center',
    width: '9.5%',
  },
  intakeBarVal: {
    fontSize: fontSize.xxs,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 4,
  },
  intakeChartBarBackground: {
    height: 50,
    width: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  intakeChartBarFill: {
    width: '100%',
    borderRadius: 3,
  },
  emptyCupOutline: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  intakeChartBarLabel: {
    fontSize: fontSize.xxs,
    marginTop: 6,
    fontWeight: fontWeight.bold,
  },
  weeklyOverviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weeklyOverviewCol: {
    alignItems: 'center',
    gap: 4,
  },
  weeklyDayLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  weeklyAmountText: {
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.bold,
    color: '#94A3B8',
  },
  mascotBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    gap: spacing.xs,
  },
  mascotTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    marginBottom: 2,
  },
  mascotDesc: {
    fontSize: fontSize.xs,
    lineHeight: 14,
  },
  insightsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
  },
  insightsBtnText: {
    fontSize: fontSize.xxs,
    color: '#FFFFFF',
    fontWeight: 'bold',
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
    maxWidth: 340,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
  modalInput: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  modalPresets: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  presetBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
});
