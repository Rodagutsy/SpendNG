import { getDatabase } from './db/database';
import { Q } from '@nozbe/watermelondb';
import { Rule, Transaction } from '../model_legacy/models';

export interface CategorizationResult {
  categoryId: string;
  isFlagged: boolean;
  matchedRule?: string;
}

const FALLBACK_CREDIT = 'cat-06';
const FALLBACK_DEBIT = 'cat-05';

export class CategorizationEngine {
  static async categorize(
    merchantName: string | null,
    transactionType: 'credit' | 'debit',
    _amount: number,
  ): Promise<CategorizationResult> {
    if (!merchantName) return this.fallback(transactionType);

    try {
      const db = getDatabase();
      const rules = await db.get<Rule>('rules')
        .query(Q.sortBy('priority', Q.desc))
        .fetch();

      const lowerMerchant = merchantName.trim().toLowerCase();

      for (const rule of rules) {
        const keyword = rule.keyword.trim().toLowerCase();
        let matched = false;

        switch (rule.matchType) {
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
            categoryId: rule.categoryId,
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
      const db = getDatabase();
      const oneDay = 24 * 60 * 60 * 1000;
      const matches = await db.get<Transaction>('transactions').query(
        Q.where('amount', amount),
        Q.where('transaction_date', Q.gte(transactionDate - oneDay)),
        Q.where('transaction_date', Q.lte(transactionDate + oneDay)),
      ).fetch();

      return matches.length > 0;
    } catch {
      return false;
    }
  }

  static async processUserCorrection(
    merchantName: string,
    _oldCategoryId: string,
    _newCategoryId: string,
  ): Promise<{ showPrompt: boolean }> {
    try {
      const db = getDatabase();
      const otherCount = await db.get<Transaction>('transactions').query(
        Q.where('merchant_name', merchantName),
      ).fetchCount();

      return { showPrompt: otherCount > 1 };
    } catch {
      return { showPrompt: false };
    }
  }

  static async applyCorrectionToAll(merchantName: string, newCategoryId: string): Promise<void> {
    try {
      const db = getDatabase();
      const records = await db.get<Transaction>('transactions').query(
        Q.where('merchant_name', merchantName),
      ).fetch();

      await db.write(async () => {
        await Promise.all(
          records.map((t) =>
            t.update((record) => {
              record.categoryId = newCategoryId;
            })
          )
        );
      });
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
