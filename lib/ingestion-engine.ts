import * as Crypto from 'expo-crypto';
import { Parser } from './parser';
import { CategorizationEngine } from './categorization-engine';
import { getDatabase } from './db/database';
import { Transaction, SyncLog, FailedParse } from '../model_legacy/models';
import { useTransactionStore } from './stores/transactionStore';

export class IngestionEngine {
  static isTransactionAlert(rawBody: string): boolean {
    const lower = rawBody.toLowerCase();
    return /(?:debit|credit|dr|cr|spent|received|pos|purchase|withdrawal|transfer)/i.test(lower)
      && /(?:ngn|₦|\d+\.\d{2})/i.test(lower);
  }

  static async processAlert(
    rawBody: string,
    sender: string,
    timestamp: number,
    sourceChannel: 'sms' | 'email' = 'sms',
  ): Promise<{ success: boolean; transactionId?: string }> {
    try {
      if (sourceChannel === 'sms' && !this.isTransactionAlert(rawBody)) {
        console.log(`[IngestionEngine] Ignored non-transaction alert from ${sender}`);
        return { success: false };
      }

      const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawBody);
      if (await this.isContentDuplicate(hash)) {
        console.log(`[IngestionEngine] Duplicate raw content hash detected: ${hash}`);
        return { success: false };
      }

      const parseResult = sourceChannel === 'email'
        ? Parser.parseEmail(rawBody, sender, timestamp)
        : Parser.parseSMS(rawBody, sender, timestamp);

      if (!parseResult) {
        await this.logFailedParse(sourceChannel, sender, 'Could not parse message', rawBody);
        return { success: false };
      }

      if (await this.isDuplicate(parseResult.amount, parseResult.merchantName, parseResult.transactionDate)) {
        console.log(`[IngestionEngine] Duplicate transaction detected (amount+merchant+time window)`);
        await this.logSyncEvent(sourceChannel, sender, rawBody, 'duplicate');
        return { success: false };
      }

      const category = await CategorizationEngine.categorizeWithAmountDisambiguation(
        parseResult.merchantName,
        parseResult.transactionType,
        parseResult.amount,
      );

      const isSelfTransfer = await CategorizationEngine.detectSelfTransfer(
        parseResult.amount,
        parseResult.transactionDate,
      );

      const db = getDatabase();
      const record = await db.write(async () => {
        const collection = db.get<Transaction>('transactions');
        return collection.create((t) => {
          t.amount = parseResult.amount;
          t.currency = parseResult.currency;
          t.transactionType = parseResult.transactionType;
          t.merchantName = parseResult.merchantName;
          t.categoryId = category.categoryId;
          t.accountName = parseResult.accountName;
          t.accountNumberLast4 = parseResult.accountNumberLast4;
          t.transactionDate = parseResult.transactionDate;
          t.availableBalance = parseResult.availableBalance;
          t.sourceChannel = parseResult.sourceChannel;
          t.rawSourceText = parseResult.rawSourceText || null;
          t.parseConfidence = parseResult.parseConfidence;
          t.isDuplicate = false;
          t.isFlaggedForReview = category.isFlagged || isSelfTransfer;
          t.notes = isSelfTransfer ? 'Internal Transfer' : null;
          t.isSynced = false;
        });
      });

      await this.logSyncEvent(sourceChannel, sender, rawBody, 'success', record.id);

      // Trigger store fetch to update UI
      await useTransactionStore.getState().fetchTransactions();

      return { success: true, transactionId: record.id };
    } catch (error) {
      console.error('Ingestion engine error:', error);
      await this.logFailedParse(sourceChannel, sender, `Error: ${error}`, rawBody);
      return { success: false };
    }
  }

  static async processBatch(
    alerts: Array<{ body: string; sender: string; timestamp: number; sourceChannel: 'sms' | 'email' }>,
    onProgress?: (processed: number, total: number) => void,
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (let i = 0; i < alerts.length; i++) {
      const alert = alerts[i];
      const result = await this.processAlert(alert.body, alert.sender, alert.timestamp, alert.sourceChannel);
      if (result.success) success++;
      else failed++;
      onProgress?.(i + 1, alerts.length);
    }

    return { success, failed };
  }

  private static async isContentDuplicate(hash: string): Promise<boolean> {
    try {
      const db = getDatabase();
      const { Q } = require('@nozbe/watermelondb');
      const matches = await db.get<SyncLog>('sync_logs').query(
        Q.where('raw_content_hash', hash)
      ).fetch();
      return matches.length > 0;
    } catch {
      return false;
    }
  }

  private static async isDuplicate(
    amount: number,
    merchantName: string | null,
    transactionDate: number
  ): Promise<boolean> {
    try {
      const db = getDatabase();
      const { Q } = require('@nozbe/watermelondb');
      const fiveMinutes = 5 * 60 * 1000;

      let query = db.get<Transaction>('transactions').query(
        Q.where('amount', amount),
        Q.where('transaction_date', Q.gte(transactionDate - fiveMinutes)),
        Q.where('transaction_date', Q.lte(transactionDate + fiveMinutes))
      );

      const matches = await query.fetch();
      if (!merchantName) {
        return matches.length > 0;
      }

      const targetMerchant = merchantName.trim().toLowerCase();
      return matches.some(m => m.merchantName && m.merchantName.trim().toLowerCase() === targetMerchant);
    } catch {
      return false;
    }
  }

  private static async logSyncEvent(
    sourceChannel: string,
    senderIdentifier: string,
    rawContent: string,
    parseStatus: string,
    transactionId?: string,
  ): Promise<void> {
    try {
      const db = getDatabase();
      const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawContent);

      await db.write(async () => {
        const collection = db.get<SyncLog>('sync_logs');
        await collection.create((log) => {
          log.sourceChannel = sourceChannel;
          log.senderIdentifier = senderIdentifier;
          log.rawContentHash = hash;
          log.parseStatus = parseStatus;
          log.transactionId = transactionId || null;
          log.failureReason = null;
        });
      });
    } catch (error) {
      console.error('Failed to log sync event:', error);
    }
  }

  private static async logFailedParse(
    sourceChannel: string,
    senderIdentifier: string,
    failureReason: string,
    rawContent: string,
  ): Promise<void> {
    try {
      const db = getDatabase();
      await db.write(async () => {
        const collection = db.get<FailedParse>('failed_parses');
        await collection.create((fp) => {
          fp.sourceChannel = sourceChannel;
          fp.senderIdentifier = senderIdentifier;
          fp.failureReason = failureReason;
          fp.isReviewed = false;
          fp.reviewedAt = null;
        });
      });
    } catch (error) {
      console.error('Failed to log parse failure:', error);
    }
  }
}
