export interface User {
  id: number;
  name: string;
  age: number;
  weight: number;
  height: number;
  waterGoal: number;
  wakeUpTime: string;
  sleepTime: string;
  notificationSound: string;
  onboardingComplete: boolean;
  locale: string;
  theme: ThemeMode;
}

export type DosageUnit = 'mg' | 'ml' | 'tablets' | 'capsules';

export type ReminderType = 'once' | 'multiple' | 'interval' | 'weekdays' | 'custom';

export type MedicationStatus = 'pending' | 'taken' | 'skipped' | 'snoozed';

export interface ReminderTime {
  id: string;
  time: string;
  days?: number[];
}

export interface Medication {
  id: number;
  name: string;
  dosage: number;
  unit: DosageUnit;
  notes: string;
  startDate: string;
  endDate: string;
  color: string;
  imageUri?: string;
  reminderType: ReminderType;
  reminderTimes: ReminderTime[];
  intervalHours?: number;
  isActive: boolean;
  createdAt: string;
}

export interface MedicationLog {
  id: number;
  medicationId: number;
  medicationName: string;
  dosage: number;
  unit: DosageUnit;
  scheduledTime: string;
  status: MedicationStatus;
  completedAt: string;
}

export interface WaterLog {
  id: number;
  amount: number;
  createdAt: string;
}

export interface DailyStats {
  date: string;
  takenDoses: number;
  missedDoses: number;
  totalDoses: number;
  adherencePercent: number;
  waterIntake: number;
  waterGoal: number;
}

export interface WeeklyStats {
  weekStart: string;
  days: DailyStats[];
  averageAdherence: number;
  averageWaterIntake: number;
}

export type ThemeMode = 'light' | 'dark' | 'system';
