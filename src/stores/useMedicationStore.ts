import { create } from 'zustand';
import { Medication, MedicationLog, MedicationStatus } from '@/types';
import { executeQuery, executeRun, getFirst } from '@/db/database';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { generateId } from '@/lib/utils';
import { t as translate, translateUnit } from '@/i18n';
import { useSettingsStore } from '@/stores/useSettingsStore';

interface MedicationState {
  medications: Medication[];
  todayLogs: MedicationLog[];
  isLoading: boolean;
  loadMedications: () => Promise<void>;
  loadTodayLogs: () => Promise<void>;
  addMedication: (med: Omit<Medication, 'id' | 'createdAt' | 'isActive'>) => Promise<number>;
  updateMedication: (id: number, data: Partial<Medication>) => Promise<void>;
  deleteMedication: (id: number) => Promise<void>;
  logStatus: (medicationId: number, scheduledTime: string, status: MedicationStatus) => Promise<void>;
  getMedicationById: (id: number) => Promise<Medication | null>;
  generateTodayLogs: () => Promise<void>;
}

export const useMedicationStore = create<MedicationState>((set, get) => ({
  medications: [],
  todayLogs: [],
  isLoading: false,

  loadMedications: async () => {
    set({ isLoading: true });
    const meds = await executeQuery<Medication>(
      `SELECT * FROM medications WHERE isActive = 1 AND endDate >= date('now') ORDER BY createdAt DESC`
    );
    const parsed = meds.map((m) => ({
      ...m,
      reminderTimes: JSON.parse(m.reminderTimes as unknown as string),
    }));
    set({ medications: parsed, isLoading: false });
  },

  loadTodayLogs: async () => {
    const today = new Date().toISOString().split('T')[0];
    const logs = await executeQuery<MedicationLog>(
      `SELECT * FROM medication_logs WHERE date(scheduledTime) = ? ORDER BY scheduledTime ASC`,
      [today]
    );
    set({ todayLogs: logs });
  },

  addMedication: async (med) => {
    const result = await executeRun(
      `INSERT INTO medications (name, dosage, unit, notes, startDate, endDate, color, imageUri, reminderType, reminderTimes, intervalHours, isActive, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))`,
      [
        med.name,
        med.dosage,
        med.unit,
        med.notes,
        med.startDate,
        med.endDate,
        med.color,
        med.imageUri || null,
        med.reminderType,
        JSON.stringify(med.reminderTimes),
        med.intervalHours || null,
      ]
    );
    await get().loadMedications();

    const locale = useSettingsStore.getState().locale;
    for (const rt of med.reminderTimes) {
      const [h, m] = rt.time.split(':').map(Number);
      const trigger = new Date();
      trigger.setHours(h, m, 0, 0);
      if (trigger <= new Date()) trigger.setDate(trigger.getDate() + 1);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: translate('notif.medTitle', locale),
          body: translate('notif.medBody', locale, { name: med.name, dosage: med.dosage, unit: translateUnit(med.unit, locale) }),
          data: { medicationId: result.lastInsertRowId, type: 'medication', scheduledTime: rt.time },
          categoryIdentifier: 'medication',
          sound: Platform.OS === 'ios' ? 'som.wav' : 'som.mp3',
        },
        trigger: {
          type: 'daily',
          hour: h,
          minute: m,
          repeats: true,
        } as any,
      });
    }

    return result.lastInsertRowId as number;
  },

  updateMedication: async (id, data) => {
    const fields = Object.keys(data)
      .filter((k) => k !== 'id' && k !== 'createdAt')
      .map((k) => `${k} = ?`)
      .join(', ');
    const values = Object.entries(data)
      .filter(([k]) => k !== 'id' && k !== 'createdAt')
      .map(([key, val]) => (key === 'reminderTimes' ? JSON.stringify(val) : val));
    await executeRun(`UPDATE medications SET ${fields} WHERE id = ?`, [...values, id]);
    await get().loadMedications();
  },

  deleteMedication: async (id) => {
    await executeRun('UPDATE medications SET isActive = 0 WHERE id = ?', [id]);
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of scheduled) {
      if (n.content.data?.medicationId === id) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    }
    await get().loadMedications();
  },

  logStatus: async (medicationId, scheduledTime, status) => {
    const med = await getFirst<{ name: string; dosage: number; unit: string }>(
      'SELECT name, dosage, unit FROM medications WHERE id = ?',
      [medicationId]
    );
    if (!med) return;

    const existing = await getFirst<MedicationLog>(
      `SELECT * FROM medication_logs WHERE medicationId = ? AND scheduledTime = ?`,
      [medicationId, scheduledTime]
    );

    if (existing) {
      await executeRun(
        `UPDATE medication_logs SET status = ?, completedAt = datetime('now') WHERE id = ?`,
        [status, existing.id]
      );
    } else {
      await executeRun(
        `INSERT INTO medication_logs (medicationId, medicationName, dosage, unit, scheduledTime, status, completedAt)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
        [medicationId, med.name, med.dosage, med.unit, scheduledTime, status]
      );
    }
    await get().loadTodayLogs();
  },

  getMedicationById: async (id) => {
    const med = await getFirst<Medication>('SELECT * FROM medications WHERE id = ?', [id]);
    if (!med) return null;
    return { ...med, reminderTimes: JSON.parse(med.reminderTimes as unknown as string) };
  },

  generateTodayLogs: async () => {
    const today = new Date().toISOString().split('T')[0];
    const meds = get().medications;

    for (const med of meds) {
      for (const rt of med.reminderTimes) {
        const scheduledTime = `${today} ${rt.time}`;
        const existing = await getFirst<{ id: number }>(
          `SELECT id FROM medication_logs WHERE medicationId = ? AND scheduledTime = ?`,
          [med.id, scheduledTime]
        );
        if (!existing) {
          await executeRun(
            `INSERT OR IGNORE INTO medication_logs (medicationId, medicationName, dosage, unit, scheduledTime, status)
             VALUES (?, ?, ?, ?, ?, 'pending')`,
            [med.id, med.name, med.dosage, med.unit, scheduledTime]
          );
        }
      }
    }
    await get().loadTodayLogs();
  },
}));
