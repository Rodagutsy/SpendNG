import * as Crypto from 'expo-crypto';
import { Parser } from './parser';
import { CategorizationEngine } from './categorization-engine';
import { supabase } from './supabase';
import { useTransactionStore } from './stores/transactionStore';
import { useCategoryDefaultStore } from './stores/categoryDefaultStore';
import { useUIStore } from './stores/uiStore';

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

      const confidenceLevel = parseResult.parseConfidence;

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
        isFlaggedForReview: confidenceLevel !== 'high' || category.isFlagged || isSelfTransfer,
        notes: isSelfTransfer ? 'Internal Transfer' : null,
        taxClassificationId: null,
        confidenceLevel,
        receiptImageUri: null,
      });

      if (newTransaction) {
        const def = useCategoryDefaultStore.getState().getDefaultForCategory(category.categoryId);
        if (def?.defaultTaxClassificationId) {
          await useTransactionStore.getState().updateTransaction(newTransaction.id, {
            taxClassificationId: def.defaultTaxClassificationId,
          });
        }
      }

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

    useUIStore.getState().setImportProgress({ found: alerts.length, processed: 0 });

    for (let i = 0; i < alerts.length; i++) {
      const alert = alerts[i];
      const result = await this.processAlert(alert.body, alert.sender, alert.timestamp, alert.sourceChannel);
      if (result.success) success++;
      else failed++;

      const processed = i + 1;
      useUIStore.getState().setImportProgress({ found: alerts.length, processed });
      onProgress?.(processed, alerts.length);
    }

    return { success, failed };
  }

  private static async isContentDuplicate(hash: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('transactions')
        .select('id')
        .eq('raw_source_text', hash);

      return (data?.length || 0) > 0;
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

      const { data: matches } = await supabase
        .from('transactions')
        .select('id, merchant_name')
        .eq('amount', amount)
        .gte('transaction_date', transactionDate - fiveMinutes)
        .lte('transaction_date', transactionDate + fiveMinutes);

      if (!matches || matches.length === 0) return false;

      if (!merchantName) {
        return matches.length > 0;
      }

      const targetMerchant = merchantName.trim().toLowerCase();
      return matches.some(m => m.merchant_name && m.merchant_name.trim().toLowerCase() === targetMerchant);
    } catch {
      return false;
    }
  }

  private static async logFailedParse(
    sourceChannel: string,
    senderIdentifier: string,
    failureReason: string,
    rawContent: string,
  ): Promise<void> {
    try {
      await supabase.from('failed_parses').insert({
        id: Crypto.randomUUID(),
        source_channel: sourceChannel,
        sender_identifier: senderIdentifier,
        failure_reason: failureReason,
        raw_source_text: rawContent,
        is_reviewed: false,
        created_at: Date.now(),
      });
    } catch (error) {
      console.error('Failed to log parse failure:', error);
    }
  }
}
