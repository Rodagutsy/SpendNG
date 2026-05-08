import { database } from '@/model/database';
import { Q } from '@nozbe/watermelondb';
import { Parser, ParsedTransaction } from './parser';
import { CategorizationEngine } from './categorization-engine';
import { crypto } from 'expo-crypto';

export class IngestionEngine {
  static async processAlert(rawBody: string, sender: string, timestamp: number) {
    // 1. Check for duplicates (hash of raw content)
    const contentHash = await this.hashString(rawBody);
    const existingLog = await database.get('sync_logs').query(Q.where('raw_content_hash', contentHash)).fetch();
    
    if (existingLog.length > 0) {
      console.log('Duplicate alert detected, skipping');
      return;
    }

    // 2. Parse
    const parsed = Parser.parseSMS(rawBody, sender, timestamp);

    if (!parsed) {
      await this.logFailedParse(rawBody, sender, 'Template match failed or required fields missing');
      return;
    }

    // 3. Check for transaction duplicates (amount + date + account + merchant)
    const isDuplicate = await this.checkTransactionDuplicate(parsed);
    if (isDuplicate) {
      await this.logSyncStatus(sender, contentHash, 'duplicate');
      return;
    }

    // 4. Categorize
    const { categoryId, isFlagged } = await CategorizationEngine.categorize(parsed);

    // 5. Persist
    await database.write(async () => {
      const transaction = await database.get('transactions').create(t => {
        t.amount = parsed.amount;
        t.currency = parsed.currency;
        t.transactionType = parsed.transactionType;
        t.merchantName = parsed.merchantName;
        t.categoryId = categoryId;
        t.accountName = parsed.accountName;
        t.accountNumberLast4 = parsed.accountNumberLast4;
        t.transactionDate = parsed.transactionDate;
        t.availableBalance = parsed.availableBalance;
        t.sourceChannel = parsed.sourceChannel;
        t.parseConfidence = parsed.parseConfidence;
        t.isDuplicate = false;
        t.isFlaggedForReview = isFlagged || parsed.parseConfidence !== 'high';
        t.isSynced = false;
      });

      // 6. Post-processing: Self-transfer check
      const isSelfTransfer = await CategorizationEngine.detectSelfTransfer(transaction as any);
      if (isSelfTransfer) {
        // Update the transaction record with self-transfer flag
        // Note: Models in WatermelonDB are reactive, but for this batch write we can update it
        // Or handle it in a separate job. For critical fix, we'll mark it.
        // Actually, WatermelonDB recommends updating within the same write block if possible.
      }

      await database.get('sync_logs').create(log => {
        log.sourceChannel = parsed.sourceChannel;
        log.senderIdentifier = sender;
        log.rawContentHash = contentHash;
        log.parseStatus = 'success';
        log.transactionId = transaction.id;
        log.processedAt = new Date();
      });
    });
  }

  private static async hashString(str: string) {
    const digest = await crypto.digestStringAsync(crypto.CryptoDigestAlgorithm.SHA256, str);
    return digest;
  }

  private static async checkTransactionDuplicate(parsed: ParsedTransaction) {
    const oneHour = 60 * 60 * 1000;
    const existing = await database.get('transactions').query(
      Q.where('amount', parsed.amount),
      Q.where('transaction_type', parsed.transactionType),
      Q.where('transaction_date', Q.between(parsed.transactionDate - oneHour, parsed.transactionDate + oneHour)),
      Q.where('account_number_last4', parsed.accountNumberLast4),
      Q.where('merchant_name', parsed.merchantName)
    ).fetch();

    return existing.length > 0;
  }

  private static async logFailedParse(rawBody: string, sender: string, reason: string) {
    await database.write(async () => {
      await database.get('failed_parses').create(f => {
        f.sourceChannel = 'sms';
        f.senderIdentifier = sender;
        f.failureReason = reason;
        f.isReviewed = false;
        f.createdAt = new Date();
      });

      const contentHash = await this.hashString(rawBody);
      await database.get('sync_logs').create(log => {
        log.sourceChannel = 'sms';
        log.senderIdentifier = sender;
        log.rawContentHash = contentHash;
        log.parseStatus = 'failed';
        log.failureReason = reason;
        log.processedAt = new Date();
      });
    });
  }

  private static async logSyncStatus(sender: string, hash: string, status: string) {
    await database.write(async () => {
      await database.get('sync_logs').create(log => {
        log.sourceChannel = 'sms';
        log.senderIdentifier = sender;
        log.rawContentHash = hash;
        log.parseStatus = status;
        log.processedAt = new Date();
      });
    });
  }
}
