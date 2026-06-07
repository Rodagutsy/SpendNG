import { db, rules, transactions } from './db';
import { eq, and, gte, lte, desc, count } from 'drizzle-orm';

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
      const ruleRecords = await db.select().from(rules).orderBy(desc(rules.priority));
      const lowerMerchant = merchantName.trim().toLowerCase();

      for (const rule of ruleRecords) {
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
      const fiveMinutes = 5 * 60 * 1000;
      const matches = await db.select().from(transactions).where(
        and(
          eq(transactions.amount, amount),
          gte(transactions.transactionDate, transactionDate - fiveMinutes),
          lte(transactions.transactionDate, transactionDate + fiveMinutes)
        )
      );

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
      const result = await db.select({ value: count() })
        .from(transactions)
        .where(eq(transactions.merchantName, merchantName));
        
      const otherCount = result[0]?.value || 0;
      return { showPrompt: otherCount > 1 };
    } catch {
      return { showPrompt: false };
    }
  }

  static async applyCorrectionToAll(merchantName: string, newCategoryId: string): Promise<void> {
    try {
      await db.update(transactions)
        .set({ categoryId: newCategoryId, updatedAt: new Date() })
        .where(eq(transactions.merchantName, merchantName));
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
