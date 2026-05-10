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

export interface Insight {
  id: string;
  text: string;
  type: 'info' | 'increase' | 'decrease' | 'success';
}

export interface TopCategory {
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface HomeData {
  thisMonthIncome: number;
  thisMonthSpending: number;
  incomeDelta: number;
  spendingDelta: number;
  netPosition: number;
  recentTransactions: TransactionWithCategory[];
  topSpendingCategory: TopCategory;
  quickInsights: Insight[];
  categoryBreakdown: { categoryId: string; total: number; color: string; name: string; percentage: number }[];
  isLoading: boolean;
}

export function useHomeData() {
  const [data, setData] = useState<HomeData>({
    thisMonthIncome: 0,
    thisMonthSpending: 0,
    incomeDelta: 12.5,
    spendingDelta: -5.2,
    netPosition: 0,
    recentTransactions: [],
    topSpendingCategory: { name: 'None', amount: 0, percentage: 0, color: '#ccc' },
    quickInsights: [],
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

      const insights: Insight[] = [
        { id: '1', text: 'You spent ₦45,000 on transport this month', type: 'info' },
        { id: '2', text: 'Food spending increased 22%', type: 'increase' },
        { id: '3', text: 'You received 5 freelance payments this month', type: 'success' },
      ];

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
        spendingDelta: -8.0,
        netPosition: income - spending,
        recentTransactions: MOCK_TRANSACTIONS.slice(0, 7),
        topSpendingCategory: { 
          name: 'Food', 
          amount: 450, 
          percentage: 40, 
          color: '#FF6B6B' 
        },
        quickInsights: insights,
        categoryBreakdown: breakdown,
        isLoading: false,
      });
    };

    fetchData();
  }, []);

  return data;
}
