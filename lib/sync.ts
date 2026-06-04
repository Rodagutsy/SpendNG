// ─── WatermelonDB temporarily disabled ─────────────────────────────────────
// import { getDatabase } from './db/database';
// import { supabase } from './supabase';
// import { Transaction, SyncLog, FailedParse, Rule } from '../model_legacy/models';
// import { useUIStore } from './stores/uiStore';
//
// const BATCH_SIZE = 50;
// const MAX_RETRIES = 3;
//
// interface SyncQueueItem {
//   id: string;
//   table: string;
//   action: 'create' | 'update' | 'delete';
//   payload: any;
//   retries: number;
// }
//
// export async function syncData(): Promise<void> {
//   const uiStore = useUIStore.getState();
//   if (!uiStore.isOnline) return;
//
//   uiStore.setSyncStatus('syncing');
//   uiStore.setSyncProgress(0);
//
//   try {
//     const { data: { session } } = await supabase.auth.getSession();
//     if (!session) {
//       uiStore.setSyncStatus('paused');
//       return;
//     }
//
//     await syncTransactions(session.user.id);
//     await syncRules(session.user.id);
//     await syncLogs(session.user.id);
//
//     uiStore.setSyncStatus('idle');
//     uiStore.setSyncProgress(100);
//   } catch (error) {
//     console.error('Sync failed:', error);
//     uiStore.setSyncStatus('error');
//   }
// }
//
// async function syncTransactions(userId: string): Promise<void> {
//   const db = getDatabase();
//   const { Q } = require('@nozbe/watermelondb');
//
//   const unsynced = await db.get<Transaction>('transactions').query(
//     Q.where('is_synced', false),
//   ).fetch();
//
//   if (unsynced.length === 0) return;
//
//   for (let i = 0; i < unsynced.length; i += BATCH_SIZE) {
//     const batch = unsynced.slice(i, i + BATCH_SIZE);
//     const records = batch.map((t) => ({
//       user_id: userId,
//       amount: t.amount,
//       currency: t.currency,
//       transaction_type: t.transactionType,
//       merchant_name: t.merchantName,
//       category_id: t.categoryId,
//       account_name: t.accountName,
//       account_number_last4: t.accountNumberLast4,
//       transaction_date: new Date(t.transactionDate).toISOString(),
//       available_balance: t.availableBalance,
//       source_channel: t.sourceChannel,
//       parse_confidence: t.parseConfidence,
//       is_duplicate: t.isDuplicate,
//       is_flagged_for_review: t.isFlaggedForReview,
//       notes: t.notes,
//     }));
//
//     const { error } = await supabase.from('transactions').insert(records);
//     if (error) throw error;
//
//     await db.write(async () => {
//       await Promise.all(
//         batch.map((t) =>
//           t.update((record) => {
//             record.isSynced = true;
//           })
//         )
//       );
//     });
//
//     useUIStore.getState().setSyncProgress(Math.round(((i + batch.length) / unsynced.length) * 100));
//   }
// }
//
// async function syncRules(userId: string): Promise<void> {
//   const db = getDatabase();
//   const { Q } = require('@nozbe/watermelondb');
//
//   const unsyncedRules = await db.get<Rule>('rules').query(
//     Q.where('is_system', false),
//     Q.where('remote_id', null),
//   ).fetch();
//
//   if (unsyncedRules.length === 0) return;
//
//   const records = unsyncedRules.map((r) => ({
//     user_id: userId,
//     keyword: r.keyword,
//     match_type: r.matchType,
//     category_id: r.categoryId,
//     priority: r.priority,
//     is_system: false,
//   }));
//
//   const { data, error } = await supabase.from('rules').insert(records).select();
//   if (error) throw error;
//
//   if (data) {
//     await db.write(async () => {
//       await Promise.all(
//         unsyncedRules.map((r, index) =>
//           r.update((record) => {
//             record.remoteId = data[index]?.rule_id;
//           })
//         )
//       );
//     });
//   }
// }
//
// async function syncLogs(userId: string): Promise<void> {
//   const db = getDatabase();
//   const { Q } = require('@nozbe/watermelondb');
//
//   const unsyncedLogs = await db.get<SyncLog>('sync_logs').query(
//     Q.where('remote_id', null),
//   ).fetch();
//
//   if (unsyncedLogs.length === 0) return;
//
//   const records = unsyncedLogs.map((log) => ({
//     user_id: userId,
//     source_channel: log.sourceChannel,
//     sender_identifier: log.senderIdentifier,
//     raw_content_hash: log.rawContentHash,
//     parse_status: log.parseStatus,
//     transaction_id: log.transactionId,
//     failure_reason: log.failureReason,
//   }));
//
//   const { error } = await supabase.from('sync_logs').insert(records);
//   if (error) throw error;
//
//   await db.write(async () => {
//     await Promise.all(
//       unsyncedLogs.map((log) =>
//         log.update((record) => {
//           record.rawContentHash = 'synced';
//         })
//       )
//     );
//   });
// }
//
// export async function syncFailedParses(userId: string): Promise<void> {
//   const db = getDatabase();
//   const { Q } = require('@nozbe/watermelondb');
//
//   const unsynced = await db.get<FailedParse>('failed_parses').query(
//     Q.where('remote_id', null),
//   ).fetch();
//
//   if (unsynced.length === 0) return;
//
//   const records = unsynced.map((fp) => ({
//     user_id: userId,
//     source_channel: fp.sourceChannel,
//     sender_identifier: fp.senderIdentifier,
//     failure_reason: fp.failureReason,
//     is_reviewed: fp.isReviewed,
//   }));
//
//   const { error } = await supabase.from('failed_parses').insert(records);
//   if (error) throw error;
// }
//
// export function startPeriodicSync(intervalMs: number = 5 * 60 * 1000): () => void {
//   const interval = setInterval(() => {
//     syncData().catch(console.error);
//   }, intervalMs);
//
//   return () => clearInterval(interval);
// }
//
// export async function syncOnReconnect(): Promise<void> {
//   useUIStore.getState().setOnline(true);
//   await syncData();
// }
// ─────────────────────────────────────────────────────────────────────────────

import { useUIStore } from './stores/uiStore';

export async function syncData(): Promise<void> {
  console.log('[Sync] WatermelonDB disabled – syncData stub called');
}

export async function syncFailedParses(userId: string): Promise<void> {
  console.log('[Sync] WatermelonDB disabled – syncFailedParses stub called');
}

export function startPeriodicSync(_intervalMs: number = 5 * 60 * 1000): () => void {
  console.log('[Sync] WatermelonDB disabled – periodic sync not started');
  return () => {};
}

export async function syncOnReconnect(): Promise<void> {
  console.log('[Sync] WatermelonDB disabled – syncOnReconnect stub called');
}
