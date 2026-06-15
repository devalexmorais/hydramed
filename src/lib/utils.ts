import { format, parse, isToday, isYesterday, isSameDay, startOfWeek, startOfMonth, endOfWeek, endOfMonth, eachDayOfInterval } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { ptBR } from 'date-fns/locale/pt-BR';
import { es } from 'date-fns/locale/es';

const dateLocales = { en: enUS, 'pt-BR': ptBR, es } as const;

function resolveDateLocale(appLocale: string = 'en') {
  return dateLocales[appLocale as keyof typeof dateLocales] ?? enUS;
}

export function formatTime(time: string): string {
  try {
    const parsed = parse(time, 'HH:mm', new Date());
    return format(parsed, 'h:mm a');
  } catch {
    return time;
  }
}

export function formatDate(date: string): string {
  try {
    const parsed = new Date(date);
    if (isToday(parsed)) return 'Today';
    if (isYesterday(parsed)) return 'Yesterday';
    return format(parsed, 'MMM d, yyyy');
  } catch {
    return date;
  }
}

export function formatDateFull(date: string, appLocale: string = 'en'): string {
  try {
    return format(new Date(date), 'EEEE, MMMM d, yyyy', { locale: resolveDateLocale(appLocale) });
  } catch {
    return date;
  }
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function getWeekDays(): string[] {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  return eachDayOfInterval({ start: weekStart, end: weekEnd }).map(
    (d) => format(d, 'yyyy-MM-dd')
  );
}

export function getMonthDays(year: number, month: number): string[] {
  const date = new Date(year, month - 1);
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  return eachDayOfInterval({ start: monthStart, end: monthEnd }).map(
    (d) => format(d, 'yyyy-MM-dd')
  );
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function calculateAdherence(
  taken: number,
  skipped: number,
  total: number
): number {
  if (total === 0) return 0;
  return Math.round((taken / total) * 100);
}

export function distributeWaterReminders(
  goal: number,
  wakeUp: string,
  sleep: string
): string[] {
  const wakeParts = wakeUp.split(':').map(Number);
  const sleepParts = sleep.split(':').map(Number);
  const wakeMinutes = wakeParts[0] * 60 + wakeParts[1];
  const sleepMinutes = sleepParts[0] * 60 + sleepParts[1];
  const awakeMinutes = sleepMinutes - wakeMinutes;
  const intervalMinutes = Math.max(awakeMinutes / Math.ceil(goal / 250), 60);
  const reminders: string[] = [];
  
  for (let m = wakeMinutes; m < sleepMinutes; m += intervalMinutes) {
    const hours = Math.floor(m / 60);
    const mins = Math.round(m % 60);
    reminders.push(
      `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
    );
  }
  return reminders;
}
