import { useState, useEffect } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../model/database';
import { Transaction } from '../model/models';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

export interface HomeData {
  thisMonthIncome: number;
  thisMonthSpending: number;
  incomeDelta: number;
  spendingDelta: number;
  recentTransactions: Transaction[];
  categoryBreakdown: { categoryId: string; total: number; color: string; name: string; percentage: number }[];
  isLoading: boolean;
}

export function useHomeData() {
  const [data, setData] = useState<HomeData>({
    thisMonthIncome: 0,
    thisMonthSpending: 0,
    incomeDelta: 0,
    spendingDelta: 0,
    recentTransactions: [],
    categoryBreakdown: [],
    isLoading: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const now = new Date();
        const thisMonthStart = startOfMonth(now).getTime();
        const thisMonthEnd = endOfMonth(now).getTime();
        const lastMonthStart = startOfMonth(subMonths(now, 1)).getTime();
        const lastMonthEnd = endOfMonth(subMonths(now, 1)).getTime();

        // 1. Fetch recent transactions
        const recentTransactions = await database
          .get<Transaction>('transactions')
          .query(Q.sortBy('date', Q.desc), Q.take(10))
          .fetch();

        // 2. Fetch this month's transactions for summary
        const thisMonthTransactions = await database
          .get<Transaction>('transactions')
          .query(Q.where('date', Q.between(thisMonthStart, thisMonthEnd)))
          .fetch();

        // 3. Fetch last month's transactions for delta
        const lastMonthTransactions = await database
          .get<Transaction>('transactions')
          .query(Q.where('date', Q.between(lastMonthStart, lastMonthEnd)))
          .fetch();

        // Calculate totals
        const calcTotals = (txs: Transaction[]) => {
          let income = 0;
          let spending = 0;
          txs.forEach((tx) => {
            if (tx.transactionType === 'credit') income += tx.amount;
            else spending += tx.amount;
          });
          return { income, spending };
        };

        const thisMonthTotals = calcTotals(thisMonthTransactions);
        const lastMonthTotals = calcTotals(lastMonthTransactions);

        const incomeDelta = lastMonthTotals.income === 0
          ? (thisMonthTotals.income > 0 ? 100 : 0)
          : ((thisMonthTotals.income - lastMonthTotals.income) / lastMonthTotals.income) * 100;

        const spendingDelta = lastMonthTotals.spending === 0
          ? (thisMonthTotals.spending > 0 ? 100 : 0)
          : ((thisMonthTotals.spending - lastMonthTotals.spending) / lastMonthTotals.spending) * 100;

        // 4. Category breakdown (this month)
        const categories = await database.get('categories').query().fetch();
        const breakdownMap: Record<string, { total: number; color: string; name: string }> = {};

        thisMonthTransactions.forEach((tx) => {
          if (tx.transactionType === 'debit') {
            const catId = tx.categoryId;
            if (!breakdownMap[catId]) {
              const cat = categories.find(c => c.id === catId);
              breakdownMap[catId] = {
                total: 0,
                color: (cat as any)?.colorHex || '#666',
                name: (cat as any)?.name || 'Uncategorized'
              };
            }
            breakdownMap[catId].total += tx.amount;
          }
        });

        const totalSpending = thisMonthTotals.spending || 1; // avoid div by zero
        const breakdown = Object.entries(breakdownMap)
          .map(([categoryId, data]) => ({
            categoryId,
            ...data,
            percentage: (data.total / totalSpending) * 100
          }))
          .sort((a, b) => b.total - a.total);

        // 5. Create category map for lookup
        const categoryMap: Record<string, { name: string; color: string; icon: string }> = {};
        categories.forEach((cat: any) => {
          categoryMap[cat.id] = {
            name: cat.name,
            color: cat.colorHex,
            icon: cat.iconIdentifier,
          };
        });

        setData({
          thisMonthIncome: thisMonthTotals.income,
          thisMonthSpending: thisMonthTotals.spending,
          incomeDelta,
          spendingDelta,
          recentTransactions: recentTransactions.map((tx: any) => ({
            ...tx,
            categoryName: categoryMap[tx.categoryId]?.name || 'Uncategorized',
            categoryColor: categoryMap[tx.categoryId]?.color || '#666',
            categoryIcon: categoryMap[tx.categoryId]?.icon || 'help-circle',
          })),
          categoryBreakdown: breakdown,
          isLoading: false,
        });
      } catch (error) {
        console.error('Error fetching home data:', error);
        setData(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchData();

    // In a real app, we would observe the database for changes
    // WatermelonDB's observe() would be better here for reactive UI
  }, []);

  return data;
}
