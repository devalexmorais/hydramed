import { create } from 'zustand';
import { User, ThemeMode } from '@/types';
import { getFirst, executeRun } from '@/db/database';
import { useSettingsStore } from '@/stores/useSettingsStore';

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

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isOnboarded: false,
  languageSelected: false,

  loadUser: async () => {
    try {
      const user = await getFirst<User>('SELECT * FROM users WHERE id = 1');
      if (user) {
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
          `INSERT INTO users (id, name, age, weight, height, waterGoal, wakeUpTime, sleepTime, notificationSound, onboardingComplete, locale)
           VALUES (1, '', 0, 0, 0, 2000, '07:00', '23:00', 'default', 0, '')`
        );
        const newUser = await getFirst<User>('SELECT * FROM users WHERE id = 1');
        set({ user: newUser, isOnboarded: false, languageSelected: false, isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  saveUser: async (data) => {
    const current = get().user;
    if (!current) return;
    const fields = Object.keys(data).map((k) => `${k} = ?`).join(', ');
    const values = Object.values(data);
    await executeRun(`UPDATE users SET ${fields} WHERE id = 1`, values);
    const updated = await getFirst<User>('SELECT * FROM users WHERE id = 1');
    set({ user: updated });
  },

  saveLocale: async (locale: string) => {
    await executeRun('UPDATE users SET locale = ? WHERE id = 1', [locale]);
    const user = await getFirst<User>('SELECT * FROM users WHERE id = 1');
    useSettingsStore.getState().setLocale(locale);
    set({ user, languageSelected: true });
  },

  saveTheme: async (theme: ThemeMode) => {
    await executeRun('UPDATE users SET theme = ? WHERE id = 1', [theme]);
    const user = await getFirst<User>('SELECT * FROM users WHERE id = 1');
    useSettingsStore.getState().setTheme(theme);
    set({ user });
  },

  completeOnboarding: async () => {
    await executeRun('UPDATE users SET onboardingComplete = 1 WHERE id = 1');
    const user = await getFirst<User>('SELECT * FROM users WHERE id = 1');
    set({ user, isOnboarded: true });
  },

  resetUser: async () => {
    await executeRun(
      `UPDATE users SET name = '', age = 0, weight = 0, height = 0, waterGoal = 2000,
       wakeUpTime = '07:00', sleepTime = '23:00', notificationSound = 'default',
       onboardingComplete = 0, locale = '', theme = 'system' WHERE id = 1`
    );
    await executeRun('DELETE FROM medication_logs');
    await executeRun('DELETE FROM water_logs');
    await executeRun('DELETE FROM medications');
    const user = await getFirst<User>('SELECT * FROM users WHERE id = 1');
    useSettingsStore.getState().setLocale('en');
    useSettingsStore.getState().setTheme('system');
    set({ user, isOnboarded: false, languageSelected: false });
  },
}));
