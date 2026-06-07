import * as Crypto from 'expo-crypto';
import { Parser } from './parser';
import { CategorizationEngine } from './categorization-engine';
import { db, transactions, syncLogs, failedParses } from './db';
import { eq, and, gte, lte } from 'drizzle-orm';
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

      // Use the store to add the transaction and update UI automatically
      const newTransaction = await useTransactionStore.getState().addTransaction({
        amount: parseResult.amount,
        currency: parseResult.currency,
        transactionType: parseResult.transactionType,
        merchantName: parseResult.merchantName,
        categoryId: category.categoryId,
        accountName: parseResult.accountName,
        accountNumberLast4: parseResult.accountNumberLast4,
        transactionDate: parseResult.transactionDate,
        availableBalance: parseResult.availableBalance,
        sourceChannel: parseResult.sourceChannel,
        originalMessage: parseResult.rawSourceText || null,
        isFlaggedForReview: category.isFlagged || isSelfTransfer,
        notes: isSelfTransfer ? 'Internal Transfer' : null,
        taxClassification: null,
        confidenceLevel: null,
        receiptImageUri: null,
      });

      await this.logSyncEvent(sourceChannel, sender, rawBody, 'success', newTransaction.id);

      return { success: true, transactionId: newTransaction.id };
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
      const matches = await db.select().from(syncLogs).where(eq(syncLogs.rawContentHash, hash));
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
      const fiveMinutes = 5 * 60 * 1000;

      const matches = await db.select().from(transactions).where(
        and(
          eq(transactions.amount, amount),
          gte(transactions.transactionDate, transactionDate - fiveMinutes),
          lte(transactions.transactionDate, transactionDate + fiveMinutes)
        )
      );

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
      const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawContent);

      await db.insert(syncLogs).values({
        id: Crypto.randomUUID(),
        sourceChannel,
        senderIdentifier,
        rawContentHash: hash,
        parseStatus,
        transactionId: transactionId || null,
        processedAt: new Date(),
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
      await db.insert(failedParses).values({
        id: Crypto.randomUUID(),
        sourceChannel,
        senderIdentifier,
        failureReason,
        rawSourceText: rawContent,
        isReviewed: false,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Failed to log parse failure:', error);
    }
  }
}
