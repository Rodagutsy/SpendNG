import { TransactionWithCategory } from '../hooks/useHomeData';

export const MOCK_CATEGORIES = [
  { id: 'cat1', name: 'Food & Dining', colorHex: '#FF6B6B', iconIdentifier: 'cart.fill' },
  { id: 'cat2', name: 'Transportation', colorHex: '#4ECDC4', iconIdentifier: 'car.fill' },
  { id: 'cat3', name: 'Entertainment', colorHex: '#45B7D1', iconIdentifier: 'play.tv.fill' },
  { id: 'cat4', name: 'Shopping', colorHex: '#96CEB4', iconIdentifier: 'bag.fill' },
  { id: 'cat5', name: 'Income', colorHex: '#00BD00', iconIdentifier: 'arrow.down.circle.fill' },
];

export const MOCK_TRANSACTIONS: TransactionWithCategory[] = [
  {
    id: 't1',
    merchantName: 'Apple Store',
    amount: 1200.00,
    transactionType: 'debit',
    transactionDate: new Date().getTime() - 86400000 * 2, // 2 days ago
    accountName: 'Main Account',
    categoryId: 'cat4',
    categoryName: 'Shopping',
    categoryColor: '#96CEB4',
    categoryIcon: 'bag.fill',
  },
  {
    id: 't2',
    merchantName: 'Starbucks',
    amount: 5.50,
    transactionType: 'debit',
    transactionDate: new Date().getTime() - 86400000 * 1, // 1 day ago
    accountName: 'Main Account',
    categoryId: 'cat1',
    categoryName: 'Food & Dining',
    categoryColor: '#FF6B6B',
    categoryIcon: 'cart.fill',
  },
  {
    id: 't3',
    merchantName: 'Monthly Salary',
    amount: 4500.00,
    transactionType: 'credit',
    transactionDate: new Date().getTime() - 3600000 * 5, // 5 hours ago
    accountName: 'Savings Account',
    categoryId: 'cat5',
    categoryName: 'Income',
    categoryColor: '#00BD00',
    categoryIcon: 'arrow.down.circle.fill',
  },
  {
    id: 't4',
    merchantName: 'Uber',
    amount: 15.20,
    transactionType: 'debit',
    transactionDate: new Date().getTime() - 3600000 * 2, // 2 hours ago
    accountName: 'Main Account',
    categoryId: 'cat2',
    categoryName: 'Transportation',
    categoryColor: '#4ECDC4',
    categoryIcon: 'car.fill',
  },
  {
    id: 't5',
    merchantName: 'Netflix',
    amount: 19.99,
    transactionType: 'debit',
    transactionDate: new Date().getTime(), // Today
    accountName: 'Main Account',
    categoryId: 'cat3',
    categoryName: 'Entertainment',
    categoryColor: '#45B7D1',
    categoryIcon: 'play.tv.fill',
  },
];
