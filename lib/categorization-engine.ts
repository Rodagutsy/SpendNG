import { database } from '@/model/database';
import { Q } from '@nozbe/watermelondb';
import { Rule, Category, Transaction } from '@/model/models';
import { ParsedTransaction } from './parser';

export class CategorizationEngine {
  /**
   * Main entry point to categorize a parsed transaction
   */
  static async categorize(parsed: ParsedTransaction): Promise<{ categoryId: string; isFlagged: boolean }> {
    const merchant = parsed.merchantName?.toLowerCase() || '';
    
    // 1. Check for Exact Match (Priority 1)
    if (merchant) {
      const exactRule = await database.get<Rule>('rules')
        .query(Q.where('keyword', merchant), Q.where('match_type', 'exact'))
        .fetch();
      
      if (exactRule.length > 0) {
        return { categoryId: exactRule[0].categoryId, isFlagged: false };
      }
    }

    // 2. Check for Contains/Starts With Match (Priority 2 & 3)
    if (merchant) {
      const partialRules = await database.get<Rule>('rules')
        .query(
          Q.or(
            Q.where('match_type', 'contains'),
            Q.where('match_type', 'starts_with')
          ),
          Q.sortBy('priority', Q.desc)
        )
        .fetch();

      for (const rule of partialRules) {
        if (rule.matchType === 'contains' && merchant.includes(rule.keyword.toLowerCase())) {
          // Check for amount-based disambiguation (e.g., Shoprite, MTN)
          const categoryId = this.applyDisambiguation(rule.categoryId, parsed.amount);
          return { categoryId, isFlagged: false };
        }
        if (rule.matchType === 'starts_with' && merchant.startsWith(rule.keyword.toLowerCase())) {
          return { categoryId: rule.categoryId, isFlagged: false };
        }
      }
    }

    // 3. Pattern Matching (Priority 4)
    // Salary Detection
    if (parsed.transactionType === 'credit') {
      const salaryKeywords = ['salary', 'payroll', 'wages'];
      if (salaryKeywords.some(k => merchant.includes(k))) {
        return { categoryId: 'cat-07', isFlagged: false };
      }
    }

    // Generic Transfers Sent
    if (parsed.transactionType === 'debit' && (!merchant || merchant.includes('transfer to'))) {
      return { categoryId: 'cat-05', isFlagged: true };
    }

    // 4. Default to Uncategorized (Priority 5)
    return { categoryId: 'cat-14', isFlagged: true };
  }

  /**
   * Handle amount-based category shifts (e.g., MTN, Shoprite)
   */
  private static applyDisambiguation(categoryId: string, amount: number): string {
    // Shoprite Rule: <= 50k Food, > 50k Shopping
    if (categoryId === 'cat-01' && amount > 50000) return 'cat-09';
    
    // MTN/Airtel Rule: > 5k often not just airtime (e.g. data for office)
    // But for now we stick to 5k threshold as per spec
    if (categoryId === 'cat-04' && amount > 5000) return 'cat-14';

    return categoryId;
  }

  /**
   * Detect self-transfers based on time and amount window
   */
  static async detectSelfTransfer(tx: Transaction): Promise<boolean> {
    const window = 10 * 60 * 1000; // 10 minutes
    const oppositeType = tx.transactionType === 'debit' ? 'credit' : 'debit';
    
    const matches = await database.get<Transaction>('transactions').query(
      Q.where('id', Q.notEq(tx.id)),
      Q.where('transaction_type', oppositeType),
      Q.where('amount', Q.between(tx.amount - 0.01, tx.amount + 0.01)),
      Q.where('transaction_date', Q.between(tx.transactionDate - window, tx.transactionDate + window))
    ).fetch();

    return matches.length > 0;
  }
}
