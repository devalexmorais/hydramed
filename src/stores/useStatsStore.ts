import { create } from 'zustand';
import { DailyStats, WeeklyStats } from '@/types';
import { executeQuery } from '@/db/database';
import { calculateAdherence } from '@/lib/utils';

interface StatsRow {
  day: string;
  taken: number;
  skipped: number;
  total: number;
}

interface WaterRow {
  day: string;
  intake: number;
}

interface GoalRow {
  waterGoal: number;
}

interface CountRow {
  count: number;
}

interface WaterSumRow {
  total: number;
}

interface StatsState {
  dailyStats: DailyStats | null;
  weeklyStats: WeeklyStats | null;
  isLoading: boolean;
  loadDailyStats: () => Promise<void>;
  loadWeeklyStats: () => Promise<void>;
  loadMonthlyAdherence: () => Promise<number>;
}

export const useStatsStore = create<StatsState>((set) => ({
  dailyStats: null,
  weeklyStats: null,
  isLoading: false,

  loadDailyStats: async () => {
    set({ isLoading: true });
    const today = new Date().toISOString().split('T')[0];

    const taken = await executeQuery<CountRow>(
      `SELECT COUNT(*) as count FROM medication_logs WHERE date(scheduledTime) = ? AND status = 'taken'`,
      [today]
    );
    const missed = await executeQuery<CountRow>(
      `SELECT COUNT(*) as count FROM medication_logs WHERE date(scheduledTime) = ? AND status = 'skipped'`,
      [today]
    );
    const total = await executeQuery<CountRow>(
      `SELECT COUNT(*) as count FROM medication_logs WHERE date(scheduledTime) = ?`,
      [today]
    );
    const water = await executeQuery<WaterSumRow>(
      `SELECT COALESCE(SUM(amount), 0) as total FROM water_logs WHERE date(createdAt) = ?`,
      [today]
    );
    const goal = await executeQuery<GoalRow>(
      `SELECT waterGoal FROM users WHERE id = 1`
    );

    const takenCount = taken[0]?.count || 0;
    const missedCount = missed[0]?.count || 0;
    const totalCount = total[0]?.count || 0;

    set({
      dailyStats: {
        date: today,
        takenDoses: takenCount,
        missedDoses: missedCount,
        totalDoses: totalCount,
        adherencePercent: calculateAdherence(takenCount, missedCount, takenCount + missedCount),
        waterIntake: water[0]?.total || 0,
        waterGoal: goal[0]?.waterGoal || 2000,
      },
      isLoading: false,
    });
  },

  loadWeeklyStats: async () => {
    set({ isLoading: true });
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekStart = weekAgo.toISOString().split('T')[0];

    const logs = await executeQuery<StatsRow>(
      `SELECT date(scheduledTime) as day,
              COUNT(*) FILTER (WHERE status = 'taken') as taken,
              COUNT(*) FILTER (WHERE status = 'skipped') as skipped,
              COUNT(*) as total
       FROM medication_logs
       WHERE date(scheduledTime) >= ? AND date(scheduledTime) <= date('now')
       GROUP BY date(scheduledTime)`,
      [weekStart]
    );

    const waterData = await executeQuery<WaterRow>(
      `SELECT date(createdAt) as day, COALESCE(SUM(amount), 0) as intake
       FROM water_logs WHERE date(createdAt) >= ? AND date(createdAt) <= date('now')
       GROUP BY date(createdAt)`,
      [weekStart]
    );

    const goal = await executeQuery<GoalRow>(
      `SELECT waterGoal FROM users WHERE id = 1`
    );
    const waterGoal = goal[0]?.waterGoal || 2000;

    const days = logs.map((l) => ({
      date: l.day,
      takenDoses: l.taken,
      missedDoses: l.skipped,
      totalDoses: l.total,
      adherencePercent: calculateAdherence(l.taken, l.skipped, l.taken + l.skipped),
      waterIntake: waterData.find((w) => w.day === l.day)?.intake || 0,
      waterGoal,
    }));

    const avgAdherence = days.length > 0
      ? Math.round(days.reduce((s, d) => s + d.adherencePercent, 0) / days.length)
      : 0;
    const avgWater = days.length > 0
      ? Math.round(waterData.reduce((s, w) => s + w.intake, 0) / 7)
      : 0;

    set({
      weeklyStats: { weekStart, days, averageAdherence: avgAdherence, averageWaterIntake: avgWater },
      isLoading: false,
    });
  },

  loadMonthlyAdherence: async () => {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const taken = await executeQuery<CountRow>(
      `SELECT COUNT(*) as count FROM medication_logs WHERE scheduledTime >= ? AND status = 'taken'`,
      [monthAgo.toISOString()]
    );
    const missed = await executeQuery<CountRow>(
      `SELECT COUNT(*) as count FROM medication_logs WHERE scheduledTime >= ? AND status = 'skipped'`,
      [monthAgo.toISOString()]
    );
    const takenCount = taken[0]?.count || 0;
    const missedCount = missed[0]?.count || 0;
    return calculateAdherence(takenCount, missedCount, takenCount + missedCount);
  },
}));
