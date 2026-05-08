import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, text, children, relation } from '@nozbe/watermelondb/decorators';

export class Transaction extends Model {
  static table = 'transactions';

  @text('remote_id') remoteId!: string | null;
  @field('amount') amount!: number;
  @text('currency') currency!: string;
  @text('transaction_type') transactionType!: 'credit' | 'debit';
  @text('merchant_name') merchantName!: string | null;
  @text('category_id') categoryId!: string;
  @text('account_name') accountName!: string | null;
  @text('account_number_last4') accountNumberLast4!: string | null;
  @field('transaction_date') transactionDate!: number;
  @field('available_balance') availableBalance!: number | null;
  @text('source_channel') sourceChannel!: 'sms' | 'email' | 'manual';
  @text('raw_source_text') rawSourceText!: string | null;
  @text('parse_confidence') parseConfidence!: string | null;
  @field('is_duplicate') isDuplicate!: boolean;
  @field('is_flagged_for_review') isFlaggedForReview!: boolean;
  @text('notes') notes!: string | null;
  @field('is_synced') isSynced!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

export class Category extends Model {
  static table = 'categories';

  @text('remote_id') remoteId!: string | null;
  @text('name') name!: string;
  @text('icon_identifier') iconIdentifier!: string;
  @text('color_hex') colorHex!: string;
  @text('transaction_type_hint') transactionTypeHint!: 'credit' | 'debit' | 'both';
  @field('is_system') isSystem!: boolean;
  @readonly @date('created_at') createdAt!: Date;
}

export class Rule extends Model {
  static table = 'rules';

  @text('remote_id') remoteId!: string | null;
  @text('keyword') keyword!: string;
  @text('match_type') matchType!: 'exact' | 'contains' | 'starts_with' | 'regex';
  @text('category_id') categoryId!: string;
  @field('priority') priority!: number;
  @field('is_system') isSystem!: boolean;
  @date('last_applied_at') lastAppliedAt!: Date | null;
  @readonly @date('created_at') createdAt!: Date;
}

export class SyncLog extends Model {
  static table = 'sync_logs';

  @text('remote_id') remoteId!: string | null;
  @text('source_channel') sourceChannel!: string;
  @text('sender_identifier') senderIdentifier!: string;
  @text('raw_content_hash') rawContentHash!: string;
  @text('parse_status') parseStatus!: string;
  @text('transaction_id') transactionId!: string | null;
  @text('failure_reason') failureReason!: string | null;
  @readonly @date('processed_at') processedAt!: Date;
}

export class FailedParse extends Model {
  static table = 'failed_parses';

  @text('remote_id') remoteId!: string | null;
  @text('source_channel') sourceChannel!: string;
  @text('sender_identifier') senderIdentifier!: string;
  @text('failure_reason') failureReason!: string;
  @field('is_reviewed') isReviewed!: boolean;
  @date('reviewed_at') reviewedAt!: Date | null;
  @readonly @date('created_at') createdAt!: Date;
}
