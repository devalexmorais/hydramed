import { create } from 'zustand';
import { WaterLog } from '@/types';
import { executeQuery, executeRun } from '@/db/database';

interface WaterState {
  todayIntake: number;
  todayLogs: WaterLog[];
  isLoading: boolean;
  loadToday: () => Promise<void>;
  addWater: (amount: number) => Promise<void>;
  undoLastWater: () => Promise<void>;
  getWeeklyAverage: () => Promise<number>;
  getMonthlyAverage: () => Promise<number>;
}

export const useWaterStore = create<WaterState>((set, get) => ({
  todayIntake: 0,
  todayLogs: [],
  isLoading: false,

  loadToday: async () => {
    set({ isLoading: true });
    const today = new Date().toISOString().split('T')[0];
    const logs = await executeQuery<WaterLog>(
      `SELECT * FROM water_logs WHERE date(createdAt) = ? ORDER BY createdAt ASC`,
      [today]
    );
    const total = logs.reduce((sum, log) => sum + log.amount, 0);
    set({ todayLogs: logs, todayIntake: total, isLoading: false });
  },

  addWater: async (amount) => {
    await executeRun(
      `INSERT INTO water_logs (amount, createdAt) VALUES (?, datetime('now'))`,
      [amount]
    );
    await get().loadToday();
  },

  undoLastWater: async () => {
    const logs = get().todayLogs;
    if (logs.length === 0) return;
    const lastLog = logs[logs.length - 1];
    await executeRun(`DELETE FROM water_logs WHERE id = ?`, [lastLog.id]);
    await get().loadToday();
  },

  getWeeklyAverage: async () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const rows = await executeQuery<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) as total FROM water_logs WHERE createdAt >= ?`,
      [weekAgo.toISOString()]
    );
    return Math.round(rows[0]?.total / 7 || 0);
  },

  getMonthlyAverage: async () => {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const rows = await executeQuery<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) as total FROM water_logs WHERE createdAt >= ?`,
      [monthAgo.toISOString()]
    );
    return Math.round(rows[0]?.total / 30 || 0);
  },
}));
