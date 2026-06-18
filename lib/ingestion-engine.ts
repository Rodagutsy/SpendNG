import * as Crypto from 'expo-crypto';
import { Parser } from './parser';
import { CategorizationEngine } from './categorization-engine';
import { MerchantNormalizationEngine } from './merchant-normalization-engine';
import { RecurringPaymentDetector } from './recurring-payment-detector';
import { supabase } from './supabase';
import { useTransactionStore } from './stores/transactionStore';
import { useCategoryDefaultStore } from './stores/categoryDefaultStore';
import { useUIStore } from './stores/uiStore';
import { getNairaRate, detectCurrency, CURRENCY_SYMBOLS } from './exchange-rate';

export class IngestionEngine {
  static isTransactionAlert(rawBody: string): boolean {
    const lower = rawBody.toLowerCase();
    const hasTransactionKeyword = /(?:debit|credit|dr|cr|spent|received|pos|purchase|withdrawal|transfer)/i.test(lower);
    const hasAmount = /(?:ngn|₦|\$|£|€|usd|gbp|eur|\d+\.\d{2})/i.test(lower);
    return hasTransactionKeyword && hasAmount;
  }

  static async processAlert(
    rawBody: string,
    sender: string,
    timestamp: number,
    sourceChannel: 'sms' | 'email' = 'sms',
  ): Promise<{ success: boolean; transactionId?: string }> {
    const boundaryHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawBody);
    try {
      if (sourceChannel === 'sms' && !this.isTransactionAlert(rawBody)) {
        return { success: false };
      }

      const parseResult = sourceChannel === 'email'
        ? Parser.parseEmail(rawBody, sender, timestamp)
        : Parser.parseSMS(rawBody, sender, timestamp);

      if (!parseResult) {
        await this.logFailedParse(sourceChannel, sender, 'Could not parse message', rawBody, boundaryHash);
        return { success: false };
      }

      const canonicalMerchant = await MerchantNormalizationEngine.normalize(parseResult.merchantName);
      const normalizedStripped = (canonicalMerchant || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const dateMinute = Math.floor(parseResult.transactionDate / 60000);
      const hashInput = [normalizedStripped, parseResult.amount.toFixed(2), dateMinute, parseResult.currency].join('|');
      const contentHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, hashInput);

      if (await this.isContentDuplicate(contentHash)) {
        return { success: false };
      }

      const category = await CategorizationEngine.categorizeWithAmountDisambiguation(
        canonicalMerchant,
        parseResult.transactionType,
        parseResult.amount,
      );

      const isSelfTransfer = await CategorizationEngine.detectSelfTransfer(
        parseResult.amount,
        parseResult.transactionDate,
      );

      const confidenceLevel = parseResult.parseConfidence;
      const parsedCurrency = parseResult.currency.toUpperCase();
      const parsedDate = new Date(parseResult.transactionDate);

      let finalAmount = parseResult.amount;
      let amountInNaira: number | null = null;
      let exchangeRate: number | null = null;
      let rateSource: string | null = null;

      if (parsedCurrency !== 'NGN') {
        const rateResult = await getNairaRate(parsedCurrency, parsedDate);
        if (rateResult.rate > 0) {
          exchangeRate = rateResult.rate;
          amountInNaira = Math.round(parseResult.amount * rateResult.rate * 100) / 100;
          finalAmount = amountInNaira;
          rateSource = rateResult.source;
        }
      }

      const newTransaction = await useTransactionStore.getState().addTransaction({
        amount: finalAmount,
        currency: parsedCurrency === 'NGN' ? 'NGN' : parsedCurrency,
        originalCurrency: parsedCurrency !== 'NGN' ? parsedCurrency : null,
        originalAmount: parsedCurrency !== 'NGN' ? parseResult.amount : null,
        exchangeRate,
        amountInNaira,
        rateSource,
        rateDate: parsedCurrency !== 'NGN' ? parseResult.transactionDate : null,
        transactionType: parseResult.transactionType,
        merchantName: canonicalMerchant,
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
        whtAmount: null,
        whtClientName: null,
        contentHash,
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
      await this.logFailedParse(sourceChannel, sender, `Error: ${error}`, rawBody, boundaryHash);
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

    if (success > 0) {
      RecurringPaymentDetector.detect().catch(err =>
        console.error('[IngestionEngine] Recurring detection error:', err)
      );
    }

    return { success, failed };
  }

  static async processStatement(
    rows: Array<{
      date: string;
      amount: number;
      type: 'credit' | 'debit';
      description: string;
      balance: number | null;
    }>,
    bankName: string | null,
    onProgress?: (saved: number, total: number) => void,
  ): Promise<{ saved: number; skipped: number }> {
    let saved = 0;
    let skipped = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const canonicalMerchant = await MerchantNormalizationEngine.normalize(row.description || null);
        const normalizedStripped = (canonicalMerchant || row.description || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        const dateMs = new Date(row.date).getTime();
        const dateMinute = Math.floor(dateMs / 60000);
        const hashInput = [normalizedStripped, row.amount.toFixed(2), dateMinute, 'NGN'].join('|');
        const contentHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, hashInput);

        if (await this.isContentDuplicate(contentHash)) {
          skipped++;
          onProgress?.(i + 1, rows.length);
          continue;
        }

        const category = await CategorizationEngine.categorizeWithAmountDisambiguation(
          canonicalMerchant || row.description,
          row.type,
          row.amount,
        );

        const newTransaction = await useTransactionStore.getState().addTransaction({
          amount: row.amount,
          currency: 'NGN',
          transactionType: row.type,
          merchantName: canonicalMerchant || row.description || null,
          categoryId: category.categoryId,
          accountName: bankName || 'Bank Statement',
          accountNumberLast4: null,
          transactionDate: dateMs,
          availableBalance: row.balance,
          sourceChannel: 'statement',
          originalMessage: null,
          isFlaggedForReview: category.isFlagged || false,
          notes: null,
          taxClassificationId: null,
          confidenceLevel: 'high',
          receiptImageUri: null,
          whtAmount: null,
          whtClientName: null,
          contentHash,
        });

        if (newTransaction) {
          const def = useCategoryDefaultStore.getState().getDefaultForCategory(category.categoryId);
          if (def?.defaultTaxClassificationId) {
            await useTransactionStore.getState().updateTransaction(newTransaction.id, {
              taxClassificationId: def.defaultTaxClassificationId,
            });
          }
        }

        saved++;
      } catch {
        skipped++;
      }

      onProgress?.(i + 1, rows.length);
    }

    if (saved > 0) {
      RecurringPaymentDetector.detect().catch(err =>
        console.error('[IngestionEngine] Recurring detection error:', err)
      );
    }

    return { saved, skipped };
  }

  private static async isContentDuplicate(hash: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('transactions')
        .select('id')
        .eq('content_hash', hash);

      return (data?.length || 0) > 0;
    } catch (err) {
      console.warn('[IngestionEngine] Duplicate check failed:', err);
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
      return matches.some((m: any) => m.merchant_name && m.merchant_name.trim().toLowerCase() === targetMerchant);
    } catch (err) {
      console.warn('[IngestionEngine] Duplicate check failed:', err);
      return false;
    }
  }

  private static async logFailedParse(
    sourceChannel: string,
    senderIdentifier: string,
    failureReason: string,
    rawContent: string,
    contentHash?: string,
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('failed_parses').insert({
        id: Crypto.randomUUID(),
        user_id: user?.id,
        source_channel: sourceChannel,
        sender_identifier: senderIdentifier,
        failure_reason: failureReason,
        raw_source_text: rawContent,
        content_hash: contentHash,
        is_reviewed: false,
        created_at: Date.now(),
      });
    } catch (error) {
      console.error('Failed to log parse failure:', error);
    }
  }
}
