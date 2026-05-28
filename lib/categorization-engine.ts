import { getDatabase } from './db/database';
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
    amount: number,
  ): Promise<CategorizationResult> {
    try {
      const db = getDatabase();
      const rulesCollection = db.get<Rule>('rules');
      const allRules = await rulesCollection
        .query()
        .fetch();

      const sortedRules = allRules.sort((a, b) => b.priority - a.priority);

      const name = (merchantName ?? '').toLowerCase().trim();
      if (!name) {
        return this.fallback(transactionType);
      }

      for (const rule of sortedRules) {
        const keyword = rule.keyword.toLowerCase().trim();
        let matched = false;

        switch (rule.matchType) {
          case 'exact':
            matched = name === keyword;
            break;
          case 'contains':
            matched = name.includes(keyword);
            break;
          case 'starts_with':
            matched = name.startsWith(keyword);
            break;
          case 'regex':
            try {
              matched = new RegExp(keyword, 'i').test(name);
            } catch {
              matched = false;
            }
            break;
        }

        if (matched) {
          const categoryId = rule.categoryId;
          const isFlagged = categoryId === 'cat-14';
          return { categoryId, isFlagged, matchedRule: rule.keyword };
        }
      }

      return this.fallback(transactionType);
    } catch {
      return this.fallback(transactionType);
    }
  }

  static async categorizeWithAmountDisambiguation(
    merchantName: string | null,
    transactionType: 'credit' | 'debit',
    amount: number,
  ): Promise<CategorizationResult> {
    const result = await this.categorize(merchantName, transactionType, amount);
    const name = (merchantName ?? '').toLowerCase();

    if (result.categoryId === 'cat-04' && amount > 5000) {
      return { categoryId: 'cat-14', isFlagged: true, matchedRule: 'amount_disambiguated' };
    }

    if (name.includes('shoprite') && amount > 50000) {
      return { categoryId: 'cat-09', isFlagged: false, matchedRule: 'amount_disambiguated' };
    }

    if (result.categoryId === 'cat-13' && amount < 50000) {
      return { categoryId: 'cat-14', isFlagged: true, matchedRule: 'amount_disambiguated' };
    }

    return result;
  }

  static async detectSelfTransfer(
    amount: number,
    transactionDate: number,
  ): Promise<boolean> {
    try {
      const db = getDatabase();
      const { Q } = require('@nozbe/watermelondb');
      const tenMinutes = 10 * 60 * 1000;

      const matching = await db.get<Transaction>('transactions').query(
        Q.where('amount', amount),
        Q.where('transaction_date', Q.gte(transactionDate - tenMinutes)),
        Q.where('transaction_date', Q.lte(transactionDate + tenMinutes)),
      ).fetch();

      return matching.length >= 1;
    } catch {
      return false;
    }
  }

  static async processUserCorrection(
    merchantName: string,
    oldCategoryId: string,
    newCategoryId: string,
  ): Promise<{ showPrompt: boolean }> {
    try {
      const db = getDatabase();
      const rulesCollection = db.get<Rule>('rules');

      const existingRule = await rulesCollection.query(
        require('@nozbe/watermelondb').Q.where('keyword', merchantName.toLowerCase()),
        require('@nozbe/watermelondb').Q.where('match_type', 'exact'),
      ).fetch();

      if (existingRule.length > 0) {
        return { showPrompt: true };
      }

      await db.write(async () => {
        await rulesCollection.create((rule) => {
          rule.keyword = merchantName.toLowerCase();
          rule.matchType = 'exact';
          rule.categoryId = newCategoryId;
          rule.priority = 100;
          rule.isSystem = false;
        });
      });

      return { showPrompt: false };
    } catch {
      return { showPrompt: false };
    }
  }

  static async applyCorrectionToAll(merchantName: string, newCategoryId: string): Promise<void> {
    try {
      const db = getDatabase();
      const { Q } = require('@nozbe/watermelondb');

      const existing = await db.get<Transaction>('transactions').query(
        Q.where('merchant_name', merchantName.toLowerCase()),
        Q.where('category_id', Q.notEq(newCategoryId)),
      ).fetch();

      await db.write(async () => {
        await Promise.all(
          existing.map((t) =>
            t.update((record) => {
              record.categoryId = newCategoryId;
            })
          )
        );
      });
    } catch (error) {
      console.error('Failed to apply correction to all:', error);
    }
  }

  private static fallback(transactionType: 'credit' | 'debit'): CategorizationResult {
    return {
      categoryId: transactionType === 'credit' ? FALLBACK_CREDIT : FALLBACK_DEBIT,
      isFlagged: true,
    };
  }
}
