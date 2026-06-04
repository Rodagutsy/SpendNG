// ─── WatermelonDB temporarily disabled ─────────────────────────────────────
// import { getDatabase } from './db/database';
// import { Rule, Transaction } from '../model_legacy/models';

export interface CategorizationResult {
  categoryId: string;
  isFlagged: boolean;
  matchedRule?: string;
}

const FALLBACK_CREDIT = 'cat-06';
const FALLBACK_DEBIT = 'cat-05';

export class CategorizationEngine {
  static async categorize(
    _merchantName: string | null,
    transactionType: 'credit' | 'debit',
    _amount: number,
  ): Promise<CategorizationResult> {
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
    _amount: number,
    _transactionDate: number,
  ): Promise<boolean> {
    return false;
  }

  static async processUserCorrection(
    _merchantName: string,
    _oldCategoryId: string,
    _newCategoryId: string,
  ): Promise<{ showPrompt: boolean }> {
    return { showPrompt: false };
  }

  static async applyCorrectionToAll(_merchantName: string, _newCategoryId: string): Promise<void> {
    console.log('[Categorization] WatermelonDB disabled – applyCorrectionToAll stub called');
  }

  private static fallback(transactionType: 'credit' | 'debit'): CategorizationResult {
    return {
      categoryId: transactionType === 'credit' ? FALLBACK_CREDIT : FALLBACK_DEBIT,
      isFlagged: true,
    };
  }
}
