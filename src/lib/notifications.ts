import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { distributeWaterReminders } from './utils';
import { t as translate } from '@/i18n';

export async function requestNotificationPermissions(locale: string = 'en'): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('medications', {
      name: translate('notif.medChannel', locale),
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0EA5E9',
    });
    await Notifications.setNotificationChannelAsync('hydration', {
      name: translate('notif.waterChannel', locale),
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3B82F6',
    });
  }

  return true;
}

export async function scheduleMedicationReminder(
  medicationId: number,
  medicationName: string,
  dosage: number,
  unit: string,
  scheduledTime: string,
  locale: string = 'en'
): Promise<string | undefined> {
  const [hours, minutes] = scheduledTime.split(':').map(Number);
  const now = new Date();
  const trigger = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);

  if (trigger <= now) {
    trigger.setDate(trigger.getDate() + 1);
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: translate('notif.medTitle', locale),
      body: translate('notif.medBody', locale, { name: medicationName, dosage, unit }),
      data: { medicationId, type: 'medication', scheduledTime },
      categoryIdentifier: 'medication',
    },
    trigger: {
      date: trigger,
      channelId: 'medications',
      repeats: false,
    },
  });

  return id;
}

export async function scheduleHydrationReminder(
  time: string,
  locale: string = 'en'
): Promise<string | undefined> {
  const [hours, minutes] = time.split(':').map(Number);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: translate('notif.waterTitle', locale),
      body: translate('notif.waterBody', locale),
      data: { type: 'hydration', scheduledTime: time },
      categoryIdentifier: 'hydration',
    },
    trigger: {
      type: 'daily',
      hour: hours,
      minute: minutes,
      repeats: true,
    } as any,
  });

  return id;
}

export async function scheduleAllHydrationReminders(
  goal: number,
  wakeUp: string,
  sleep: string,
  locale: string = 'en'
): Promise<void> {
  await cancelAllHydrationReminders();
  const times = distributeWaterReminders(goal, wakeUp, sleep);
  await Promise.all(times.map(t => scheduleHydrationReminder(t, locale)));
}

export async function cancelAllHydrationReminders(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const hydrationIds = scheduled
    .filter(n => n.content.data?.type === 'hydration')
    .map(n => n.identifier);
  await Promise.all(
    hydrationIds.map(id => Notifications.cancelScheduledNotificationAsync(id))
  );
}

export async function cancelNotification(
  notificationId: string
): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function setupNotificationCategories(locale: string = 'en'): Promise<void> {
  await Notifications.setNotificationCategoryAsync('medication', [
    {
      identifier: 'taken',
      buttonTitle: translate('notif.taken', locale),
      options: { opensAppToForeground: false },
    },
    {
      identifier: 'snooze',
      buttonTitle: translate('notif.snooze', locale),
      options: { opensAppToForeground: false },
    },
    {
      identifier: 'skip',
      buttonTitle: translate('notif.skip', locale),
      options: { opensAppToForeground: false },
    },
  ]);

  await Notifications.setNotificationCategoryAsync('hydration', [
    {
      identifier: 'drink',
      buttonTitle: translate('notif.drink', locale),
      options: { opensAppToForeground: false },
    },
    {
      identifier: 'dismiss',
      buttonTitle: translate('notif.dismiss', locale),
      options: { opensAppToForeground: false },
    },
  ]);
}

export function setNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export function setupNotificationResponseHandler(): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const { actionIdentifier, notification } = response;
    const data = notification.request.content.data;

    if (actionIdentifier === 'drink' && data?.type === 'hydration') {
      import('@/stores/useWaterStore').then(({ useWaterStore }) => {
        useWaterStore.getState().addWater(200);
      });
    }

    if (actionIdentifier === 'taken' && data?.type === 'medication') {
      import('@/stores/useMedicationStore').then(({ useMedicationStore }) => {
        useMedicationStore.getState().logStatus(data.medicationId, data.scheduledTime, 'taken');
      });
    }

    if (actionIdentifier === 'skip' && data?.type === 'medication') {
      import('@/stores/useMedicationStore').then(({ useMedicationStore }) => {
        useMedicationStore.getState().logStatus(data.medicationId, data.scheduledTime, 'skipped');
      });
    }
  });

  return () => subscription.remove();
}
