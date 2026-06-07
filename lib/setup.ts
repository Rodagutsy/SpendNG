import { initDatabase } from './db/database';
import { seedDatabase } from './db/seed';
import { useUIStore } from './stores/uiStore';

export async function initializeApp(): Promise<void> {
  await initDatabase();
  await seedDatabase();
  useUIStore.getState().setDbInitialized(true);
}
