import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useMedicationStore } from '@/stores/useMedicationStore';
import { useWaterStore } from '@/stores/useWaterStore';
import { useStatsStore } from '@/stores/useStatsStore';

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

async function refreshAllDailyData() {
  const medStore = useMedicationStore.getState();
  const waterStore = useWaterStore.getState();
  const statsStore = useStatsStore.getState();

  await medStore.loadMedications();
  await medStore.generateTodayLogs();
  await medStore.loadTodayLogs();
  await waterStore.loadToday();
  await statsStore.loadDailyStats();
  await statsStore.loadWeeklyStats();
}

export function useDayChangeRefresh() {
  const currentDayRef = useRef(getToday());

  useEffect(() => {
    const checkAndRefresh = () => {
      const today = getToday();
      if (today !== currentDayRef.current) {
        currentDayRef.current = today;
        refreshAllDailyData();
      }
    };

    const interval = setInterval(checkAndRefresh, 30_000);
    checkAndRefresh();

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        checkAndRefresh();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, []);
}
