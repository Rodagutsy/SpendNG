import { create } from 'zustand';
import { getDatabase } from '../db/database';
import { Transaction } from '../../model_legacy/models';

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

function toRecord(t: Transaction): TransactionRecord {
  return {
    id: t.id,
    amount: t.amount,
    currency: t.currency,
    transactionType: t.transactionType as any,
    merchantName: t.merchantName,
    categoryId: t.categoryId,
    accountName: t.accountName,
    accountNumberLast4: t.accountNumberLast4,
    transactionDate: t.transactionDate,
    availableBalance: t.availableBalance,
    sourceChannel: t.sourceChannel as any,
    parseConfidence: t.parseConfidence,
    isDuplicate: t.isDuplicate,
    isFlaggedForReview: t.isFlaggedForReview,
    notes: t.notes,
    isSynced: t.isSynced,
    createdAt: t.createdAt?.getTime?.() ?? Date.now(),
    updatedAt: t.updatedAt?.getTime?.() ?? Date.now(),
  };
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  loading: false,
  error: null,
  filters: {},

  fetchTransactions: async (filters) => {
    set({ loading: true, error: null });
    try {
      const db = getDatabase();
      const { Q } = require('@nozbe/watermelondb');
      const allFilters = filters || get().filters;
      const conditions: any[] = [Q.where('is_duplicate', false)];

      if (allFilters.keyword) {
        conditions.push(Q.where('merchant_name', Q.like(`%${allFilters.keyword}%`)));
      }
      if (allFilters.categoryId) {
        conditions.push(Q.where('category_id', allFilters.categoryId));
      }
      if (allFilters.transactionType) {
        conditions.push(Q.where('transaction_type', allFilters.transactionType));
      }
      if (allFilters.startDate) {
        conditions.push(Q.where('transaction_date', Q.gte(allFilters.startDate)));
      }
      if (allFilters.endDate) {
        conditions.push(Q.where('transaction_date', Q.lte(allFilters.endDate)));
      }
      if (allFilters.sourceChannel) {
        conditions.push(Q.where('source_channel', allFilters.sourceChannel));
      }
      if (allFilters.needsReview) {
        conditions.push(Q.where('is_flagged_for_review', true));
      }

      const results = await db.get<Transaction>('transactions')
        .query(...conditions, Q.sortBy('transaction_date', Q.desc))
        .fetch();

      set({ transactions: results.map(toRecord), loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  addTransaction: async (data) => {
    const db = getDatabase();
    const record = await db.write(async () => {
      const collection = db.get<Transaction>('transactions');
      return collection.create((t) => {
        t.amount = data.amount;
        t.currency = data.currency;
        t.transactionType = data.transactionType;
        t.merchantName = data.merchantName ?? null;
        t.categoryId = data.categoryId;
        t.accountName = data.accountName ?? null;
        t.accountNumberLast4 = data.accountNumberLast4 ?? null;
        t.transactionDate = data.transactionDate;
        t.availableBalance = data.availableBalance ?? null;
        t.sourceChannel = data.sourceChannel;
        t.isDuplicate = false;
        t.isFlaggedForReview = data.isFlaggedForReview;
        t.notes = data.notes ?? null;
        t.isSynced = false;
        t.parseConfidence = 'manual';
      });
    });
    const recordData = toRecord(record);
    set((state) => ({ transactions: [recordData, ...state.transactions] }));
    return recordData;
  },

  updateCategory: async (id, categoryId) => {
    const db = getDatabase();
    await db.write(async () => {
      const record = await db.get<Transaction>('transactions').find(id);
      await record.update((t) => {
        t.categoryId = categoryId;
      });
    });
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? { ...t, categoryId } : t
      ),
    }));
  },

  updateNotes: async (id, notes) => {
    const db = getDatabase();
    await db.write(async () => {
      const record = await db.get<Transaction>('transactions').find(id);
      await record.update((t) => {
        t.notes = notes;
      });
    });
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? { ...t, notes } : t
      ),
    }));
  },

  setFilters: (filters) => {
    set({ filters });
    get().fetchTransactions(filters);
  },

  clearFilters: () => {
    set({ filters: {} });
    get().fetchTransactions({});
  },
}));
