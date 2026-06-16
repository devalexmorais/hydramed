import { create } from 'zustand';
import { User, ThemeMode } from '@/types';
import { getFirst, executeRun } from '@/db/database';
import { useSettingsStore } from '@/stores/useSettingsStore';

function normalizeUser(raw: any): User {
  return {
    ...raw,
    exerciseFrequency: raw.exercise_frequency,
    breakfastTime: raw.breakfast_time,
    lunchTime: raw.lunch_time,
    dinnerTime: raw.dinner_time,
  };
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isOnboarded: boolean;
  languageSelected: boolean;
  loadUser: () => Promise<void>;
  saveUser: (data: Partial<User>) => Promise<void>;
  saveLocale: (locale: string) => Promise<void>;
  saveTheme: (theme: ThemeMode) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetUser: () => Promise<void>;
}

const columnMap: Record<string, string> = {
  exerciseFrequency: 'exercise_frequency',
  breakfastTime: 'breakfast_time',
  lunchTime: 'lunch_time',
  dinnerTime: 'dinner_time',
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isOnboarded: false,
  languageSelected: false,

  loadUser: async () => {
    try {
      const raw = await getFirst<any>('SELECT * FROM users WHERE id = 1');
      if (raw) {
        const user = normalizeUser(raw);
        if (user.locale) {
          useSettingsStore.getState().setLocale(user.locale);
        }
        if (user.theme) {
          useSettingsStore.getState().setTheme(user.theme);
        }
        set({
          user,
          isOnboarded: !!user.onboardingComplete,
          languageSelected: !!user.locale,
          isLoading: false,
        });
      } else {
        await executeRun(
          `INSERT INTO users (id, name, age, weight, height, waterGoal, wakeUpTime, sleepTime, exercise_frequency, breakfast_time, lunch_time, dinner_time, notificationSound, onboardingComplete, locale)
           VALUES (1, '', 0, 0, 0, 2000, '07:00', '23:00', 0, '08:00', '12:00', '19:00', 'default', 0, '')`
        );
        const newUser = normalizeUser(await getFirst<any>('SELECT * FROM users WHERE id = 1'));
        set({ user: newUser, isOnboarded: false, languageSelected: false, isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  saveUser: async (data) => {
    const current = get().user;
    if (!current) return;
    const fields = Object.keys(data).map((k) => `${columnMap[k] || k} = ?`).join(', ');
    const values = Object.values(data);
    await executeRun(`UPDATE users SET ${fields} WHERE id = 1`, values);
    const updated = normalizeUser(await getFirst<any>('SELECT * FROM users WHERE id = 1'));
    set({ user: updated });
  },

  saveLocale: async (locale: string) => {
    await executeRun('UPDATE users SET locale = ? WHERE id = 1', [locale]);
    const user = normalizeUser(await getFirst<any>('SELECT * FROM users WHERE id = 1'));
    useSettingsStore.getState().setLocale(locale);
    set({ user, languageSelected: true });
  },

  saveTheme: async (theme: ThemeMode) => {
    await executeRun('UPDATE users SET theme = ? WHERE id = 1', [theme]);
    const user = normalizeUser(await getFirst<any>('SELECT * FROM users WHERE id = 1'));
    useSettingsStore.getState().setTheme(theme);
    set({ user });
  },

  completeOnboarding: async () => {
    await executeRun('UPDATE users SET onboardingComplete = 1 WHERE id = 1');
    const user = normalizeUser(await getFirst<any>('SELECT * FROM users WHERE id = 1'));
    set({ user, isOnboarded: true });
  },

  resetUser: async () => {
    await executeRun(
      `UPDATE users SET name = '', age = 0, weight = 0, height = 0, waterGoal = 2000,
       wakeUpTime = '07:00', sleepTime = '23:00', exercise_frequency = 0,
       breakfast_time = '08:00', lunch_time = '12:00', dinner_time = '19:00',
       notificationSound = 'default', onboardingComplete = 0, locale = '', theme = 'system' WHERE id = 1`
    );
    await executeRun('DELETE FROM medication_logs');
    await executeRun('DELETE FROM water_logs');
    await executeRun('DELETE FROM medications');
    const user = normalizeUser(await getFirst<any>('SELECT * FROM users WHERE id = 1'));
    useSettingsStore.getState().setLocale('en');
    useSettingsStore.getState().setTheme('system');
    set({ user, isOnboarded: false, languageSelected: false });
  },
}));
