import { TransactionRecord } from './stores/transactionStore';

export interface MonthlySummary {
  monthStart: number;
  income: number;
  expense: number;
  net: number;
  transactionCount: number;
}

export interface CategoryBreakdownItem {
  categoryId: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface TrendData {
  monthStart: number;
  income: number;
  expense: number;
  net: number;
}

export interface SpendingAlert {
  icon: string;
  text: string;
}

export interface WeeklySpend {
  weekKey: string;
  amount: number;
}

export interface CashflowSummary {
  monthlySummaries: MonthlySummary[];
  categoryBreakdown: CategoryBreakdownItem[];
  trends: TrendData[];
  totalIncome: number;
  totalExpense: number;
  netCashflow: number;
  averageMonthlyExpense: number;
  averageMonthlyIncome: number;
  topCategory: CategoryBreakdownItem | null;
  biggestMerchant: { name: string; amount: number } | null;
  mostFrequentMerchant: { name: string; count: number } | null;
  alerts: SpendingAlert[];
  weeklyBreakdown: WeeklySpend[];
  averageWeeklyExpense: number;
}

function getMonthStart(date: Date): number {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function getNextMonthStart(date: Date): number {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function getWeekId(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d.setDate(diff));
  return `${mon.getFullYear()}-W${String(Math.ceil(mon.getDate() / 7)).padStart(2, '0')}`;
}

export class CashflowEngine {
  static monthlySummaries(
    transactions: TransactionRecord[],
    months: number,
  ): MonthlySummary[] {
    const now = new Date();
    const results: MonthlySummary[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      const start = getMonthStart(d);
      const end = getNextMonthStart(d);

      const monthTxns = transactions.filter(
        t => !t.isDuplicate && t.transactionDate >= start && t.transactionDate < end,
      );

      const income = monthTxns
        .filter(t => t.transactionType === 'credit')
        .reduce((s, t) => s + t.amount, 0);

      const expense = monthTxns
        .filter(t => t.transactionType === 'debit')
        .reduce((s, t) => s + t.amount, 0);

      results.push({
        monthStart: start,
        income,
        expense,
        net: income - expense,
        transactionCount: monthTxns.length,
      });
    }

    return results;
  }

  static categoryBreakdown(
    transactions: TransactionRecord[],
    transactionType: 'credit' | 'debit',
    startDate: number,
    endDate: number,
  ): CategoryBreakdownItem[] {
    const filtered = transactions.filter(
      t => !t.isDuplicate && t.transactionType === transactionType && t.transactionDate >= startDate && t.transactionDate < endDate,
    );

    const totals = new Map<string, { amount: number; count: number }>();
    for (const t of filtered) {
      const entry = totals.get(t.categoryId) || { amount: 0, count: 0 };
      entry.amount += t.amount;
      entry.count += 1;
      totals.set(t.categoryId, entry);
    }

    const totalAmount = filtered.reduce((s, t) => s + t.amount, 0);

    const items: CategoryBreakdownItem[] = [];
    for (const [categoryId, { amount, count }] of totals) {
      items.push({
        categoryId,
        amount,
        percentage: totalAmount > 0 ? Number(((amount / totalAmount) * 100).toFixed(1)) : 0,
        count,
      });
    }

    items.sort((a, b) => b.amount - a.amount);
    return items;
  }

  static trends(
    transactions: TransactionRecord[],
    months: number,
  ): TrendData[] {
    return this.monthlySummaries(transactions, months);
  }

  static weeklyBreakdown(
    transactions: TransactionRecord[],
    startDate: number,
    endDate: number,
  ): WeeklySpend[] {
    const filtered = transactions.filter(
      t => !t.isDuplicate && t.transactionType === 'debit' && t.transactionDate >= startDate && t.transactionDate < endDate,
    );

    const byWeek = new Map<string, number>();
    for (const t of filtered) {
      const wk = getWeekId(new Date(t.transactionDate));
      byWeek.set(wk, (byWeek.get(wk) || 0) + t.amount);
    }

    const entries: WeeklySpend[] = [];
    for (const [weekKey, amount] of byWeek) {
      entries.push({ weekKey, amount });
    }
    entries.sort((a, b) => a.weekKey.localeCompare(b.weekKey));
    return entries;
  }

  static spendingAlerts(
    transactions: TransactionRecord[],
    startDate: number,
    endDate: number,
    previousStartDate: number,
    previousEndDate: number,
  ): SpendingAlert[] {
    const currentDebits = transactions.filter(
      t => !t.isDuplicate && t.transactionType === 'debit' && t.transactionDate >= startDate && t.transactionDate < endDate,
    );
    const prevDebits = transactions.filter(
      t => !t.isDuplicate && t.transactionType === 'debit' && t.transactionDate >= previousStartDate && t.transactionDate < previousEndDate,
    );

    const alerts: SpendingAlert[] = [];

    const currentCatTotals = new Map<string, number>();
    for (const t of currentDebits) {
      currentCatTotals.set(t.categoryId, (currentCatTotals.get(t.categoryId) || 0) + t.amount);
    }

    const prevCatTotals = new Map<string, number>();
    for (const t of prevDebits) {
      prevCatTotals.set(t.categoryId, (prevCatTotals.get(t.categoryId) || 0) + t.amount);
    }

    for (const [catId, total] of currentCatTotals) {
      const prevTotal = prevCatTotals.get(catId) || 0;
      if (prevTotal > 0) {
        const change = Math.round(((total - prevTotal) / prevTotal) * 100);
        if (change >= 20) {
          alerts.push({
            icon: 'trending-up',
            text: `Spending in this category increased by ${change}% this month`,
          });
        }
      }
    }

    if (alerts.length === 0) {
      alerts.push({ icon: 'trending-down', text: 'Spending this month is within normal range' });
    }

    return alerts;
  }

  static fullSummary(
    transactions: TransactionRecord[],
    months: number = 3,
  ): CashflowSummary {
    const now = new Date();
    const currentMonthStart = getMonthStart(now);
    const nextMonthStart = getNextMonthStart(now);
    const prevMonthStart = getMonthStart(new Date(now.getFullYear(), now.getMonth() - 1, 1));

    const summaries = this.monthlySummaries(transactions, months);
    const categoryBreakdown = this.categoryBreakdown(
      transactions, 'debit', currentMonthStart, nextMonthStart,
    );
    const trends = this.trends(transactions, months);
    const weeklyBreakdown = this.weeklyBreakdown(transactions, currentMonthStart, nextMonthStart);
    const alerts = this.spendingAlerts(
      transactions, currentMonthStart, nextMonthStart,
      prevMonthStart, currentMonthStart,
    );

    const totalIncome = summaries.reduce((s, m) => s + m.income, 0);
    const totalExpense = summaries.reduce((s, m) => s + m.expense, 0);
    const avgMonthlyExpense = months > 0 ? totalExpense / months : 0;
    const avgMonthlyIncome = months > 0 ? totalIncome / months : 0;
    const avgWeeklyExpense = weeklyBreakdown.length > 0
      ? weeklyBreakdown.reduce((s, w) => s + w.amount, 0) / weeklyBreakdown.length
      : 0;

    const topCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null;

    const currentDebits = transactions.filter(
      t => !t.isDuplicate && t.transactionType === 'debit' && t.transactionDate >= currentMonthStart && t.transactionDate < nextMonthStart,
    );

    const biggest = currentDebits.reduce(
      (max, t) => t.amount > (max?.amount || 0) ? t : max,
      currentDebits[0] || null,
    );
    const biggestMerchant = biggest
      ? { name: biggest.merchantName || 'Unknown', amount: biggest.amount }
      : null;

    const merchantCounts = new Map<string, number>();
    for (const t of currentDebits) {
      const name = t.merchantName || 'Unknown';
      merchantCounts.set(name, (merchantCounts.get(name) || 0) + 1);
    }
    let mostFrequentMerchant: { name: string; count: number } | null = null;
    for (const [name, count] of merchantCounts) {
      if (!mostFrequentMerchant || count > mostFrequentMerchant.count) {
        mostFrequentMerchant = { name, count };
      }
    }

    return {
      monthlySummaries: summaries,
      categoryBreakdown,
      trends,
      totalIncome,
      totalExpense,
      netCashflow: totalIncome - totalExpense,
      averageMonthlyExpense: Number(avgMonthlyExpense.toFixed(2)),
      averageMonthlyIncome: Number(avgMonthlyIncome.toFixed(2)),
      topCategory,
      biggestMerchant,
      mostFrequentMerchant,
      alerts,
      weeklyBreakdown,
      averageWeeklyExpense: Number(avgWeeklyExpense.toFixed(2)),
    };
  }
}
