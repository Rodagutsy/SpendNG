import { supabase } from './supabase';

export interface CategorizationResult {
  categoryId: string;
  isFlagged: boolean;
  matchedRule?: string;
}

const FALLBACK_CREDIT = 'other-income';
const FALLBACK_DEBIT = 'other-expense';

export class CategorizationEngine {
  static async categorize(
    merchantName: string | null,
    transactionType: 'credit' | 'debit',
    _amount: number,
  ): Promise<CategorizationResult> {
    if (!merchantName) return this.fallback(transactionType);

    try {
      const { data: ruleRecords } = await supabase
        .from('rules')
        .select('*')
        .order('priority', { ascending: false });

      const lowerMerchant = merchantName.trim().toLowerCase();

      for (const rule of (ruleRecords || [])) {
        const keyword = rule.keyword.trim().toLowerCase();
        let matched = false;

        switch (rule.match_type) {
          case 'contains':
            matched = lowerMerchant.includes(keyword);
            break;
          case 'starts_with':
            matched = lowerMerchant.startsWith(keyword);
            break;
          case 'exact':
            matched = lowerMerchant === keyword;
            break;
          case 'regex':
            try {
              matched = new RegExp(keyword, 'i').test(lowerMerchant);
            } catch {
              matched = false;
            }
            break;
        }

        if (matched) {
          return {
            categoryId: rule.category_id,
            isFlagged: false,
            matchedRule: rule.keyword,
          };
        }
      }
    } catch (err) {
      console.error('[CategorizationEngine] Rule query failed:', err);
    }

    return this.fallback(transactionType);
  }

  static async categorizeWithAmountDisambiguation(
    merchantName: string | null,
    transactionType: 'credit' | 'debit',
    amount: number,
  ): Promise<CategorizationResult> {
    return this.categorize(merchantName, transactionType, amount);
  }

  static async detectSelfTransfer(
    amount: number,
    transactionDate: number,
  ): Promise<boolean> {
    try {
      const fiveMinutes = 5 * 60 * 1000;
      const { data: matches } = await supabase
        .from('transactions')
        .select('id')
        .eq('amount', amount)
        .gte('transaction_date', transactionDate - fiveMinutes)
        .lte('transaction_date', transactionDate + fiveMinutes);

      return (matches?.length || 0) > 0;
    } catch (err) {
      console.warn('[CategorizationEngine] Self-transfer detection failed:', err);
      return false;
    }
  }

  static async processUserCorrection(
    merchantName: string,
    _oldCategoryId: string,
    _newCategoryId: string,
  ): Promise<{ showPrompt: boolean }> {
    try {
      const { count } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('merchant_name', merchantName);

      return { showPrompt: (count || 0) > 1 };
    } catch (err) {
      console.warn('[CategorizationEngine] Process user correction failed:', err);
      return { showPrompt: false };
    }
  }

  static async applyCorrectionToAll(merchantName: string, newCategoryId: string): Promise<void> {
    try {
      const nowTs = Date.now();
      await supabase
        .from('transactions')
        .update({ category_id: newCategoryId, updated_at: nowTs })
        .eq('merchant_name', merchantName);
    } catch (err) {
      console.error('[CategorizationEngine] applyCorrectionToAll failed:', err);
    }
  }

  private static fallback(transactionType: 'credit' | 'debit'): CategorizationResult {
    return {
      categoryId: transactionType === 'credit' ? FALLBACK_CREDIT : FALLBACK_DEBIT,
      isFlagged: true,
    };
  }
}
