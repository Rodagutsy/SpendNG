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
  isDuplicate: boolean;
  isFlaggedForReview: boolean;
  notes: string | null;
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
  setFilters: (filters: TransactionFilters) => void;
  clearFilters: () => void;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  loading: false,
  error: null,
  filters: {},

  fetchTransactions: async (_filters?) => {
    set({ loading: false, error: null });
    console.log('[TransactionStore] WatermelonDB disabled – fetchTransactions stub called');
  },

  addTransaction: async (_data) => {
    console.log('[TransactionStore] WatermelonDB disabled – addTransaction stub called');
    throw new Error('WatermelonDB is disabled');
  },

  updateCategory: async (_id, _categoryId) => {
    console.log('[TransactionStore] WatermelonDB disabled – updateCategory stub called');
  },

  updateNotes: async (_id, _notes) => {
    console.log('[TransactionStore] WatermelonDB disabled – updateNotes stub called');
  },

  setFilters: (_filters) => {
    set({ filters: _filters });
  },

  clearFilters: () => {
    set({ filters: {} });
  },
}));
