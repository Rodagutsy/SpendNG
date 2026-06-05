import { create } from 'zustand';

export interface TransactionRecord {
  id: string;
  amount: number;
  currency: string;
  transactionType: 'credit' | 'debit';
  merchantName: string | null;
  categoryId: string;
  accountName: string | null;
  accountNumberLast4: string | null;
  transactionDate: number;
  availableBalance: number | null;
  sourceChannel: 'sms' | 'email' | 'manual';
  parseConfidence: string | null;
  taxClassification: 'personal' | 'business' | 'shared' | null;
  confidenceLevel: 'high' | 'medium' | 'low' | null;
  originalMessage: string | null;
  isDuplicate: boolean;
  isFlaggedForReview: boolean;
  notes: string | null;
  receiptImageUri: string | null;
  isSynced: boolean;
  createdAt: number;
  updatedAt: number;
}

interface TransactionFilters {
  keyword?: string;
  categoryId?: string;
  transactionType?: 'credit' | 'debit';
  startDate?: number;
  endDate?: number;
  sourceChannel?: string;
  needsReview?: boolean;
}

interface TransactionState {
  transactions: TransactionRecord[];
  loading: boolean;
  error: string | null;
  filters: TransactionFilters;

  fetchTransactions: (filters?: TransactionFilters) => Promise<void>;
  addTransaction: (data: Omit<TransactionRecord, 'id' | 'createdAt' | 'updatedAt' | 'isDuplicate' | 'isSynced' | 'parseConfidence'>) => Promise<TransactionRecord>;
  updateCategory: (id: string, categoryId: string) => Promise<void>;
  updateNotes: (id: string, notes: string) => Promise<void>;
  updateTransaction: (id: string, data: Partial<TransactionRecord>) => void;
  deleteTransaction: (id: string) => void;
  clearAllTransactions: () => void;
  setFilters: (filters: TransactionFilters) => void;
  clearFilters: () => void;
}

const now = Date.now();
const monthStart = new Date();
monthStart.setDate(1);
monthStart.setHours(0, 0, 0, 0);
const monthStartTs = monthStart.getTime();

const mockTransactions: TransactionRecord[] = [
  {
    id: 'act1',
    amount: 15790,
    currency: 'NGN',
    transactionType: 'debit',
    merchantName: 'Shoprite',
    categoryId: 'shopping',
    accountName: 'GT Bank',
    accountNumberLast4: '1234',
    transactionDate: new Date(2026, 4, 24).getTime(),
    availableBalance: null,
    sourceChannel: 'sms',
    parseConfidence: null,
    taxClassification: null,
    confidenceLevel: 'high',
    originalMessage: 'GTBank: You spent NGN15,790 at Shoprite on 24/05/2026. Available balance: NGN245,000.',
    isDuplicate: false,
    isFlaggedForReview: false,
    notes: null,
    receiptImageUri: null,
    isSynced: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'act2',
    amount: 145790,
    currency: 'NGN',
    transactionType: 'credit',
    merchantName: 'Monthly Salary',
    categoryId: 'salary',
    accountName: 'Kuda MFB',
    accountNumberLast4: '5678',
    transactionDate: new Date(2026, 4, 30).getTime(),
    availableBalance: null,
    sourceChannel: 'manual',
    parseConfidence: null,
    taxClassification: 'personal',
    confidenceLevel: 'high',
    originalMessage: 'Kuda: Salary credit of NGN145,790 from TechCorp Ltd. Ref: SAL/MAY/2026.',
    isDuplicate: false,
    isFlaggedForReview: false,
    notes: null,
    receiptImageUri: null,
    isSynced: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'act3',
    amount: 15790,
    currency: 'NGN',
    transactionType: 'debit',
    merchantName: 'Shoprite',
    categoryId: 'shopping',
    accountName: 'GT Bank',
    accountNumberLast4: '1234',
    transactionDate: new Date(2026, 4, 24).getTime(),
    availableBalance: null,
    sourceChannel: 'sms',
    parseConfidence: null,
    taxClassification: null,
    confidenceLevel: 'low',
    originalMessage: 'GTBank: You spent NGN15,790 at Shoprite on 24/05/2026. Available balance: NGN229,210.',
    isDuplicate: false,
    isFlaggedForReview: false,
    notes: null,
    receiptImageUri: null,
    isSynced: false,
    createdAt: now,
    updatedAt: now,
  },
];

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: mockTransactions,
  loading: false,
  error: null,
  filters: {},

  fetchTransactions: async (_filters?) => {
    set({ loading: false, error: null });
    console.log('[TransactionStore] Mock mode – transactions already set');
  },

  addTransaction: async (data) => {
    const newTx: TransactionRecord = {
      id: `manual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDuplicate: false,
      isSynced: false,
      parseConfidence: null,
      ...data,
    };
    set((state) => ({
      transactions: [newTx, ...state.transactions],
    }));
    return newTx;
  },

  updateCategory: async (_id, _categoryId) => {
    console.log('[TransactionStore] Mock mode – updateCategory stub called');
  },

  updateNotes: async (_id, _notes) => {
    console.log('[TransactionStore] Mock mode – updateNotes stub called');
  },

  updateTransaction: (_id, _data) => {
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === _id ? { ...t, ..._data, updatedAt: Date.now() } : t
      ),
    }));
  },

  deleteTransaction: (_id) => {
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== _id),
    }));
  },

  clearAllTransactions: () => {
    set({ transactions: [] });
  },

  setFilters: (_filters) => {
    set({ filters: _filters });
  },

  clearFilters: () => {
    set({ filters: {} });
  },
}));

export function useMonthlyBalances() {
  const transactions = useTransactionStore((s) => s.transactions);

  const thisMonth = transactions.filter((t) => t.transactionDate >= monthStartTs);

  const moneyIn = thisMonth
    .filter((t) => t.transactionType === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);

  const moneyOut = thisMonth
    .filter((t) => t.transactionType === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = moneyIn - moneyOut;

  return { moneyIn, moneyOut, netBalance, transactionCount: thisMonth.length };
}
