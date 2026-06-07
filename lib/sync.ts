import { useUIStore } from './stores/uiStore';
import { db, transactions, syncLogs, failedParses, rules } from './db';
import { eq } from 'drizzle-orm';

// Sync engine stub adapted for Drizzle ORM
// You can expand this later when you want to sync with Supabase

export async function syncData(): Promise<void> {
  console.log('[Sync] Drizzle ORM – syncData stub called');
}

export async function syncFailedParses(userId: string): Promise<void> {
  console.log('[Sync] Drizzle ORM – syncFailedParses stub called');
}

export function startPeriodicSync(_intervalMs: number = 5 * 60 * 1000): () => void {
  console.log('[Sync] Drizzle ORM – periodic sync not started');
  return () => {};
}

export async function syncOnReconnect(): Promise<void> {
  console.log('[Sync] Drizzle ORM – syncOnReconnect stub called');
}
