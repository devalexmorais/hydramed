import { create } from 'zustand';
import { useColorScheme } from 'react-native';
import { ThemeMode } from '@/types';

interface SettingsState {
  theme: ThemeMode;
  notificationsEnabled: boolean;
  reminderInterval: number;
  locale: string;
  setTheme: (theme: ThemeMode) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setReminderInterval: (interval: number) => void;
  setLocale: (locale: string) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: 'system',
  notificationsEnabled: true,
  reminderInterval: 30,
  locale: 'en',
  setTheme: (theme) => set({ theme }),
  setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
  setReminderInterval: (interval) => set({ reminderInterval: interval }),
  setLocale: (locale) => set({ locale }),
}));

export function useIsDark(): boolean {
  const theme = useSettingsStore((s) => s.theme);
  const systemScheme = useColorScheme();
  if (theme === 'system') return systemScheme === 'dark';
  return theme === 'dark';
}
