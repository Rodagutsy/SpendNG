import './db';
import { db } from './db';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import migrations from '../drizzle/migrations';
import { seedDatabase } from './db/seed';
import { useUIStore } from './stores/uiStore';

export async function initializeApp(): Promise<void> {
  await migrate(db, migrations);
  await seedDatabase();
  useUIStore.getState().setDbInitialized(true);
}
