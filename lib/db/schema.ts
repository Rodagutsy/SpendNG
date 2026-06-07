import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  remoteId: text('remote_id'),
  amount: real('amount').notNull(),
  currency: text('currency').notNull(),
  transactionType: text('transaction_type').notNull(), // 'credit' | 'debit'
  merchantName: text('merchant_name'),
  categoryId: text('category_id').notNull(),
  accountName: text('account_name'),
  accountNumberLast4: text('account_number_last4'),
  transactionDate: integer('transaction_date').notNull(), // stored as timestamp (number)
  availableBalance: real('available_balance'),
  sourceChannel: text('source_channel').notNull(), // 'sms' | 'email' | 'manual'
  rawSourceText: text('raw_source_text'),
  parseConfidence: text('parse_confidence'),
  isDuplicate: integer('is_duplicate', { mode: 'boolean' }).notNull(),
  isFlaggedForReview: integer('is_flagged_for_review', { mode: 'boolean' }).notNull(),
  notes: text('notes'),
  isSynced: integer('is_synced', { mode: 'boolean' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  remoteId: text('remote_id'),
  name: text('name').notNull(),
  iconIdentifier: text('icon_identifier').notNull(),
  colorHex: text('color_hex').notNull(),
  transactionTypeHint: text('transaction_type_hint').notNull(), // 'credit' | 'debit' | 'both'
  isSystem: integer('is_system', { mode: 'boolean' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const rules = sqliteTable('rules', {
  id: text('id').primaryKey(),
  remoteId: text('remote_id'),
  keyword: text('keyword').notNull(),
  matchType: text('match_type').notNull(), // 'exact' | 'contains' | 'starts_with' | 'regex'
  categoryId: text('category_id').notNull(),
  priority: integer('priority').notNull(),
  isSystem: integer('is_system', { mode: 'boolean' }).notNull(),
  lastAppliedAt: integer('last_applied_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const syncLogs = sqliteTable('sync_logs', {
  id: text('id').primaryKey(),
  remoteId: text('remote_id'),
  sourceChannel: text('source_channel').notNull(),
  senderIdentifier: text('sender_identifier').notNull(),
  rawContentHash: text('raw_content_hash').notNull(),
  parseStatus: text('parse_status').notNull(),
  transactionId: text('transaction_id'),
  failureReason: text('failure_reason'),
  processedAt: integer('processed_at', { mode: 'timestamp' }).notNull(),
});

export const failedParses = sqliteTable('failed_parses', {
  id: text('id').primaryKey(),
  remoteId: text('remote_id'),
  sourceChannel: text('source_channel').notNull(),
  senderIdentifier: text('sender_identifier').notNull(),
  failureReason: text('failure_reason').notNull(),
  rawSourceText: text('raw_source_text'),
  isReviewed: integer('is_reviewed', { mode: 'boolean' }).notNull(),
  reviewedAt: integer('reviewed_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
