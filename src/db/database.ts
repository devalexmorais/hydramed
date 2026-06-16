import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<void> | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  if (!initPromise) {
    initPromise = (async () => {
      const database = await SQLite.openDatabaseAsync('hydramed.db');
      await initializeDatabase(database);
      db = database;
    })();
  }
  await initPromise;
  return db!;
}

async function initializeDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL DEFAULT '',
      age INTEGER NOT NULL DEFAULT 0,
      weight REAL NOT NULL DEFAULT 0,
      waterGoal INTEGER NOT NULL DEFAULT 2000,
      wakeUpTime TEXT NOT NULL DEFAULT '07:00',
      sleepTime TEXT NOT NULL DEFAULT '23:00',
      exercise_frequency INTEGER NOT NULL DEFAULT 0,
      breakfast_time TEXT NOT NULL DEFAULT '08:00',
      lunch_time TEXT NOT NULL DEFAULT '12:00',
      dinner_time TEXT NOT NULL DEFAULT '19:00',
      notificationSound TEXT NOT NULL DEFAULT 'default',
      onboardingComplete INTEGER NOT NULL DEFAULT 0,
      locale TEXT NOT NULL DEFAULT '',
      theme TEXT NOT NULL DEFAULT 'system'
    );

    CREATE TABLE IF NOT EXISTS medications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      dosage REAL NOT NULL,
      unit TEXT NOT NULL DEFAULT 'mg',
      notes TEXT DEFAULT '',
      startDate TEXT NOT NULL,
      endDate TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#0EA5E9',
      imageUri TEXT,
      reminderType TEXT NOT NULL DEFAULT 'once',
      reminderTimes TEXT NOT NULL DEFAULT '[]',
      intervalHours REAL,
      isActive INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS medication_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      medicationId INTEGER NOT NULL,
      medicationName TEXT NOT NULL,
      dosage REAL NOT NULL,
      unit TEXT NOT NULL,
      scheduledTime TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      completedAt TEXT,
      FOREIGN KEY (medicationId) REFERENCES medications(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS water_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount INTEGER NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_medication_logs_date ON medication_logs(scheduledTime);
    CREATE INDEX IF NOT EXISTS idx_water_logs_date ON water_logs(createdAt);
    CREATE INDEX IF NOT EXISTS idx_medication_logs_status ON medication_logs(status);
  `);

  try {
    await database.execAsync(`ALTER TABLE users ADD COLUMN locale TEXT NOT NULL DEFAULT '';`);
  } catch {
    // Column already exists
  }
  try {
    await database.execAsync(`ALTER TABLE users ADD COLUMN theme TEXT NOT NULL DEFAULT 'system';`);
  } catch {
    // Column already exists
  }

  try {
    await database.execAsync(`ALTER TABLE users ADD COLUMN height REAL NOT NULL DEFAULT 0;`);
  } catch {
    // Column already exists
  }
  try {
    await database.execAsync(`ALTER TABLE users ADD COLUMN exercise_frequency INTEGER NOT NULL DEFAULT 0;`);
  } catch {
    // Column already exists
  }
  try {
    await database.execAsync(`ALTER TABLE users ADD COLUMN breakfast_time TEXT NOT NULL DEFAULT '08:00';`);
  } catch {
    // Column already exists
  }
  try {
    await database.execAsync(`ALTER TABLE users ADD COLUMN lunch_time TEXT NOT NULL DEFAULT '12:00';`);
  } catch {
    // Column already exists
  }
  try {
    await database.execAsync(`ALTER TABLE users ADD COLUMN dinner_time TEXT NOT NULL DEFAULT '19:00';`);
  } catch {
    // Column already exists
  }
}

export async function executeQuery<T>(
  query: string,
  params: any[] = []
): Promise<T[]> {
  const database = await getDatabase();
  return database.getAllAsync<T>(query, params);
}

export async function executeRun(
  query: string,
  params: any[] = []
): Promise<SQLite.SQLiteRunResult> {
  const database = await getDatabase();
  return database.runAsync(query, params);
}

export async function getFirst<T>(
  query: string,
  params: any[] = []
): Promise<T | null> {
  const database = await getDatabase();
  return database.getFirstAsync<T>(query, params);
}
