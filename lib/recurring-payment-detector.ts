import { supabase } from './supabase';

export interface RecurringPattern {
  id: string;
  merchantName: string;
  categoryId: string | null;
  confidence: 'high' | 'medium' | 'low';
  patternType: 'fixed_subscription' | 'variable_subscription' | 'utility' | 'irregular';
  intervalDays: number;
  typicalAmount: number;
  amountTolerance: number;
  lastTransactionDate: number;
  nextExpectedDate: number | null;
  transactionIds: string[];
  occurrences: number;
  isActive: boolean;
}

const KNOWN_PERIODS = [
  { days: 1, label: 'daily' },
  { days: 7, label: 'weekly' },
  { days: 14, label: 'biweekly' },
  { days: 28, label: 'monthly' },
  { days: 30, label: 'monthly' },
  { days: 31, label: 'monthly' },
  { days: 90, label: 'quarterly' },
  { days: 182, label: 'semiannual' },
  { days: 365, label: 'annual' },
];

export class RecurringPaymentDetector {
  static async detect(
    lookbackMonths: number = 6,
  ): Promise<RecurringPattern[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const lookbackTs = Date.now() - lookbackMonths * 30 * 24 * 60 * 60 * 1000;

      const { data: transactions } = await supabase
        .from('transactions')
        .select('id, merchant_name, category_id, amount, transaction_date')
        .eq('user_id', user.id)
        .eq('transaction_type', 'debit')
        .gte('transaction_date', lookbackTs)
        .order('merchant_name', { ascending: true })
        .order('transaction_date', { ascending: true });

      if (!transactions || transactions.length < 2) return [];

      const byMerchant = new Map<string, typeof transactions>();
      for (const t of transactions) {
        const key = t.merchant_name || 'unknown';
        if (!byMerchant.has(key)) byMerchant.set(key, []);
        byMerchant.get(key)!.push(t);
      }

      const patterns: RecurringPattern[] = [];

      for (const [merchant, txns] of byMerchant.entries()) {
        if (txns.length < 2) continue;

        const dates = txns.map(t => t.transaction_date).sort((a, b) => a - b);
        const amounts = txns.map(t => t.amount);

        const gaps: number[] = [];
        for (let i = 1; i < dates.length; i++) {
          gaps.push(dates[i] - dates[i - 1]);
        }

        const periodResult = this.detectPeriod(gaps);
        if (!periodResult) continue;

        const amountResult = this.analyzeAmounts(amounts);

        const lastDate = dates[dates.length - 1];
        const intervalMs = periodResult.intervalDays * 24 * 60 * 60 * 1000;

        let patternType: RecurringPattern['patternType'];
        if (amountResult.isFixed && periodResult.intervalDays <= 31) {
          patternType = 'fixed_subscription';
        } else if (!amountResult.isFixed && periodResult.intervalDays <= 31) {
          patternType = periodResult.intervalDays === 30 || periodResult.intervalDays === 31
            ? 'utility'
            : 'variable_subscription';
        } else {
          patternType = 'irregular';
        }

        patterns.push({
          id: '',
          merchantName: merchant,
          categoryId: txns[0].category_id,
          confidence: periodResult.confidence as RecurringPattern['confidence'],
          patternType,
          intervalDays: periodResult.intervalDays,
          typicalAmount: amountResult.typical,
          amountTolerance: amountResult.tolerance,
          lastTransactionDate: lastDate,
          nextExpectedDate: lastDate + intervalMs,
          transactionIds: txns.map(t => t.id),
          occurrences: txns.length,
          isActive: true,
        });
      }

      await this.savePatterns(user.id, patterns);

      return patterns;
    } catch (err) {
      console.error('[RecurringPaymentDetector] Detection failed:', err);
      return [];
    }
  }

  private static detectPeriod(
    gaps: number[],
  ): { intervalDays: number; confidence: string } | null {
    if (gaps.length === 0) return null;

    const avgGapDays = gaps.reduce((a, b) => a + b, 0) / gaps.length / (24 * 60 * 60 * 1000);

    let bestMatch = KNOWN_PERIODS[0];
    let bestDiff = Math.abs(avgGapDays - KNOWN_PERIODS[0].days);

    for (const p of KNOWN_PERIODS) {
      const diff = Math.abs(avgGapDays - p.days);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestMatch = p;
      }
    }

    const tolerance = bestMatch.days * 0.25;
    if (bestDiff <= tolerance) {
      const confidence = gaps.length >= 3 ? 'high' : gaps.length >= 2 ? 'medium' : 'low';
      return { intervalDays: bestMatch.days, confidence };
    }

    const mean = avgGapDays * (24 * 60 * 60 * 1000);
    const variance = gaps.reduce((sum, g) => sum + (g - mean) ** 2, 0) / gaps.length;
    const cv = Math.sqrt(variance) / mean;

    if (cv < 0.3) {
      return { intervalDays: Math.round(avgGapDays), confidence: 'low' };
    }

    return null;
  }

  private static analyzeAmounts(amounts: number[]): {
    typical: number;
    tolerance: number;
    isFixed: boolean;
  } {
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    if (avg === 0) return { typical: 0, tolerance: 0, isFixed: false };

    const maxDeviation = Math.max(...amounts.map(a => Math.abs(a - avg) / avg));

    if (maxDeviation < 0.01) {
      return { typical: avg, tolerance: 0, isFixed: true };
    }

    if (maxDeviation < 0.15) {
      return { typical: avg, tolerance: Number((maxDeviation * 100).toFixed(1)), isFixed: false };
    }

    return { typical: avg, tolerance: Math.min(Number((maxDeviation * 100).toFixed(1)), 50), isFixed: false };
  }

  private static async savePatterns(
    userId: string,
    patterns: RecurringPattern[],
  ): Promise<void> {
    const now = Date.now();

    for (const p of patterns) {
      try {
        await supabase
          .from('recurring_patterns')
          .upsert(
            {
              user_id: userId,
              merchant_name: p.merchantName,
              category_id: p.categoryId,
              confidence: p.confidence,
              pattern_type: p.patternType,
              interval_days: p.intervalDays,
              typical_amount: p.typicalAmount,
              amount_tolerance: p.amountTolerance,
              last_transaction_date: p.lastTransactionDate,
              next_expected_date: p.nextExpectedDate,
              transaction_ids: p.transactionIds,
              occurrences: p.occurrences,
              is_active: true,
              last_detected_at: now,
              updated_at: now,
            },
            {
              onConflict: 'user_id, merchant_name, pattern_type',
              ignoreDuplicates: false,
            },
          );
      } catch (err) {
        console.error(`[RecurringPaymentDetector] Failed to save pattern for ${p.merchantName}:`, err);
      }
    }
  }

  static async getActivePatterns(userId: string): Promise<RecurringPattern[]> {
    try {
      const { data } = await supabase
        .from('recurring_patterns')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('next_expected_date', { ascending: true });

      if (!data) return [];

      return data.map((r: any) => ({
        id: r.id,
        merchantName: r.merchant_name,
        categoryId: r.category_id,
        confidence: r.confidence,
        patternType: r.pattern_type,
        intervalDays: r.interval_days,
        typicalAmount: Number(r.typical_amount),
        amountTolerance: Number(r.amount_tolerance),
        lastTransactionDate: r.last_transaction_date,
        nextExpectedDate: r.next_expected_date,
        transactionIds: r.transaction_ids,
        occurrences: r.occurrences,
        isActive: r.is_active,
      }));
    } catch (err) {
      console.error('[RecurringPaymentDetector] Failed to get active patterns:', err);
      return [];
    }
  }
}
