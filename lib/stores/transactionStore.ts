import { create } from 'zustand';
import { Q } from '@nozbe/watermelondb';
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
  updateTransaction: (id: string, data: Partial<TransactionRecord>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  clearAllTransactions: () => Promise<void>;
  setFilters: (filters: TransactionFilters) => void;
  clearFilters: () => void;
}

const now = Date.now();
const monthStart = new Date();
monthStart.setDate(1);
monthStart.setHours(0, 0, 0, 0);
const monthStartTs = monthStart.getTime();

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  loading: false,
  error: null,
  filters: {},

  fetchTransactions: async (filters) => {
    set({ loading: true, error: null });
    try {
      const db = getDatabase();
      const activeFilters = filters || get().filters;
      let query = db.get<Transaction>('transactions').query();

      const clauses: any[] = [];
      if (activeFilters.categoryId) {
        clauses.push(Q.where('category_id', activeFilters.categoryId));
      }
      if (activeFilters.transactionType) {
        clauses.push(Q.where('transaction_type', activeFilters.transactionType));
      }
      if (activeFilters.startDate) {
        clauses.push(Q.where('transaction_date', Q.gte(activeFilters.startDate)));
      }
      if (activeFilters.endDate) {
        clauses.push(Q.where('transaction_date', Q.lte(activeFilters.endDate)));
      }
      if (activeFilters.sourceChannel) {
        clauses.push(Q.where('source_channel', activeFilters.sourceChannel));
      }
      if (activeFilters.needsReview !== undefined) {
        clauses.push(Q.where('is_flagged_for_review', activeFilters.needsReview));
      }
      if (activeFilters.keyword) {
        clauses.push(
          Q.or(
            Q.where('merchant_name', Q.like(`%${Q.sanitizeLikeString(activeFilters.keyword)}%`)),
            Q.where('notes', Q.like(`%${Q.sanitizeLikeString(activeFilters.keyword)}%`))
          )
        );
      }
      
      if (clauses.length > 0) {
        query = db.get<Transaction>('transactions').query(...clauses);
      }

      query = query.extend(Q.sortBy('transaction_date', Q.desc));
      const records = await query.fetch();

      const transactions: TransactionRecord[] = records.map((r) => ({
        id: r.id,
        amount: r.amount,
        currency: r.currency,
        transactionType: r.transactionType,
        merchantName: r.merchantName,
        categoryId: r.categoryId,
        accountName: r.accountName,
        accountNumberLast4: r.accountNumberLast4,
        transactionDate: r.transactionDate,
        availableBalance: r.availableBalance,
        sourceChannel: r.sourceChannel,
        parseConfidence: r.parseConfidence,
        taxClassification: null,
        confidenceLevel: null,
        originalMessage: r.rawSourceText,
        isDuplicate: r.isDuplicate,
        isFlaggedForReview: r.isFlaggedForReview,
        notes: r.notes,
        receiptImageUri: null,
        isSynced: r.isSynced,
        createdAt: r.createdAt.getTime(),
        updatedAt: r.updatedAt.getTime(),
      }));

      set({ transactions, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch transactions', loading: false });
    }
  },

  addTransaction: async (data) => {
    const db = getDatabase();
    let newRecord: Transaction | null = null;
    await db.write(async () => {
      newRecord = await db.get<Transaction>('transactions').create((t) => {
        t.amount = data.amount;
        t.currency = data.currency;
        t.transactionType = data.transactionType;
        t.merchantName = data.merchantName;
        t.categoryId = data.categoryId;
        t.accountName = data.accountName;
        t.accountNumberLast4 = data.accountNumberLast4;
        t.transactionDate = data.transactionDate;
        t.availableBalance = data.availableBalance;
        t.sourceChannel = data.sourceChannel;
        t.rawSourceText = data.originalMessage;
        t.parseConfidence = null;
        t.isDuplicate = false;
        t.isFlaggedForReview = data.isFlaggedForReview || false;
        t.notes = data.notes;
        t.isSynced = false;
      });
    });

    if (!newRecord) {
      throw new Error('Failed to create transaction record');
    }

    const rec = newRecord as Transaction;
    const added: TransactionRecord = {
      id: rec.id,
      amount: rec.amount,
      currency: rec.currency,
      transactionType: rec.transactionType,
      merchantName: rec.merchantName,
      categoryId: rec.categoryId,
      accountName: rec.accountName,
      accountNumberLast4: rec.accountNumberLast4,
      transactionDate: rec.transactionDate,
      availableBalance: rec.availableBalance,
      sourceChannel: rec.sourceChannel,
      parseConfidence: rec.parseConfidence,
      taxClassification: null,
      confidenceLevel: null,
      originalMessage: rec.rawSourceText,
      isDuplicate: rec.isDuplicate,
      isFlaggedForReview: rec.isFlaggedForReview,
      notes: rec.notes,
      receiptImageUri: null,
      isSynced: rec.isSynced,
      createdAt: rec.createdAt.getTime(),
      updatedAt: rec.updatedAt.getTime(),
    };

    set((state) => ({
      transactions: [added, ...state.transactions],
    }));

    return added;
  },

  updateCategory: async (id, categoryId) => {
    const db = getDatabase();
    const record = await db.get<Transaction>('transactions').find(id);
    await db.write(async () => {
      await record.update((t) => {
        t.categoryId = categoryId;
      });
    });
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? { ...t, categoryId, updatedAt: Date.now() } : t
      ),
    }));
  },

  updateNotes: async (id, notes) => {
    const db = getDatabase();
    const record = await db.get<Transaction>('transactions').find(id);
    await db.write(async () => {
      await record.update((t) => {
        t.notes = notes;
      });
    });
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? { ...t, notes, updatedAt: Date.now() } : t
      ),
    }));
  },

  updateTransaction: async (id, data) => {
    const db = getDatabase();
    const record = await db.get<Transaction>('transactions').find(id);
    await db.write(async () => {
      await record.update((t) => {
        if (data.amount !== undefined) t.amount = data.amount;
        if (data.currency !== undefined) t.currency = data.currency;
        if (data.transactionType !== undefined) t.transactionType = data.transactionType;
        if (data.merchantName !== undefined) t.merchantName = data.merchantName;
        if (data.categoryId !== undefined) t.categoryId = data.categoryId;
        if (data.accountName !== undefined) t.accountName = data.accountName;
        if (data.accountNumberLast4 !== undefined) t.accountNumberLast4 = data.accountNumberLast4;
        if (data.transactionDate !== undefined) t.transactionDate = data.transactionDate;
        if (data.availableBalance !== undefined) t.availableBalance = data.availableBalance;
        if (data.notes !== undefined) t.notes = data.notes;
        if (data.isFlaggedForReview !== undefined) t.isFlaggedForReview = data.isFlaggedForReview;
      });
    });
    const state = get();
    await state.fetchTransactions(state.filters);
  },

  deleteTransaction: async (id) => {
    const db = getDatabase();
    const record = await db.get<Transaction>('transactions').find(id);
    await db.write(async () => {
      await record.destroyPermanently();
    });
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    }));
  },

  clearAllTransactions: async () => {
    const db = getDatabase();
    await db.write(async () => {
      await db.unsafeResetDatabase();
    });
    set({ transactions: [] });
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
