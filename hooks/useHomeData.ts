import { useState, useEffect } from 'react';
import { MOCK_TRANSACTIONS } from '../lib/mockData';

export interface TransactionWithCategory {
  id: string;
  merchantName: string | null;
  amount: number;
  transactionType: 'credit' | 'debit';
  transactionDate: number;
  accountName: string | null;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
}

export interface HomeData {
  thisMonthIncome: number;
  thisMonthSpending: number;
  incomeDelta: number;
  spendingDelta: number;
  recentTransactions: TransactionWithCategory[];
  categoryBreakdown: { categoryId: string; total: number; color: string; name: string; percentage: number }[];
  isLoading: boolean;
}

export function useHomeData() {
  const [data, setData] = useState<HomeData>({
    thisMonthIncome: 0,
    thisMonthSpending: 0,
    incomeDelta: 12.5, // Dummy values for now
    spendingDelta: -5.2,
    recentTransactions: [],
    categoryBreakdown: [],
    isLoading: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));

      const income = MOCK_TRANSACTIONS
        .filter(t => t.transactionType === 'credit')
        .reduce((sum, t) => sum + t.amount, 0);

      const spending = MOCK_TRANSACTIONS
        .filter(t => t.transactionType === 'debit')
        .reduce((sum, t) => sum + t.amount, 0);

      const breakdown = [
        { categoryId: 'cat1', total: 450, color: '#FF6B6B', name: 'Food', percentage: 40 },
        { categoryId: 'cat4', total: 350, color: '#96CEB4', name: 'Shopping', percentage: 30 },
        { categoryId: 'cat2', total: 200, color: '#4ECDC4', name: 'Transport', percentage: 20 },
        { categoryId: 'cat3', total: 100, color: '#45B7D1', name: 'Entertainment', percentage: 10 },
      ];

      setData({
        thisMonthIncome: income,
        thisMonthSpending: spending,
        incomeDelta: 12.5,
        spendingDelta: -5.2,
        recentTransactions: MOCK_TRANSACTIONS,
        categoryBreakdown: breakdown,
        isLoading: false,
      });
    };

    fetchData();
  }, []);

  return data;
}
