import { create } from 'zustand';
import { db, transactions } from '../db';
import { eq, or, like, desc, and, gte, lte } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';

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
      const activeFilters = filters || get().filters;
      const clauses: any[] = [];

      if (activeFilters.categoryId) {
        clauses.push(eq(transactions.categoryId, activeFilters.categoryId));
      }
      if (activeFilters.transactionType) {
        clauses.push(eq(transactions.transactionType, activeFilters.transactionType));
      }
      if (activeFilters.startDate) {
        clauses.push(gte(transactions.transactionDate, activeFilters.startDate));
      }
      if (activeFilters.endDate) {
        clauses.push(lte(transactions.transactionDate, activeFilters.endDate));
      }
      if (activeFilters.sourceChannel) {
        clauses.push(eq(transactions.sourceChannel, activeFilters.sourceChannel));
      }
      if (activeFilters.needsReview !== undefined) {
        clauses.push(eq(transactions.isFlaggedForReview, activeFilters.needsReview));
      }
      if (activeFilters.keyword) {
        const k = `%${activeFilters.keyword}%`;
        clauses.push(
          or(
            like(transactions.merchantName, k),
            like(transactions.notes, k)
          )
        );
      }
      
      const records = await db.select()
        .from(transactions)
        .where(clauses.length > 0 ? and(...clauses) : undefined)
        .orderBy(desc(transactions.transactionDate));

      const txs: TransactionRecord[] = records.map((r) => ({
        id: r.id,
        amount: r.amount,
        currency: r.currency,
        transactionType: r.transactionType as 'credit' | 'debit',
        merchantName: r.merchantName,
        categoryId: r.categoryId,
        accountName: r.accountName,
        accountNumberLast4: r.accountNumberLast4,
        transactionDate: r.transactionDate,
        availableBalance: r.availableBalance,
        sourceChannel: r.sourceChannel as 'sms' | 'email' | 'manual',
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

      set({ transactions: txs, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch transactions', loading: false });
    }
  },

  addTransaction: async (data) => {
    const newId = Crypto.randomUUID();
    const nowTs = new Date();
    
    await db.insert(transactions).values({
      id: newId,
      amount: data.amount,
      currency: data.currency,
      transactionType: data.transactionType,
      merchantName: data.merchantName,
      categoryId: data.categoryId,
      accountName: data.accountName,
      accountNumberLast4: data.accountNumberLast4,
      transactionDate: data.transactionDate,
      availableBalance: data.availableBalance,
      sourceChannel: data.sourceChannel,
      rawSourceText: data.originalMessage,
      parseConfidence: null,
      isDuplicate: false,
      isFlaggedForReview: data.isFlaggedForReview || false,
      notes: data.notes,
      isSynced: false,
      createdAt: nowTs,
      updatedAt: nowTs,
    });

    const added: TransactionRecord = {
      ...data,
      id: newId,
      parseConfidence: null,
      taxClassification: null,
      confidenceLevel: null,
      isDuplicate: false,
      isFlaggedForReview: data.isFlaggedForReview || false,
      receiptImageUri: null,
      isSynced: false,
      createdAt: nowTs.getTime(),
      updatedAt: nowTs.getTime(),
    };

    set((state) => ({
      transactions: [added, ...state.transactions],
    }));

    return added;
  },

  updateCategory: async (id, categoryId) => {
    await db.update(transactions)
      .set({ categoryId, updatedAt: new Date() })
      .where(eq(transactions.id, id));
      
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? { ...t, categoryId, updatedAt: Date.now() } : t
      ),
    }));
  },

  updateNotes: async (id, notes) => {
    await db.update(transactions)
      .set({ notes, updatedAt: new Date() })
      .where(eq(transactions.id, id));

    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? { ...t, notes, updatedAt: Date.now() } : t
      ),
    }));
  },

  updateTransaction: async (id, data) => {
    const updateData: any = { updatedAt: new Date() };
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.transactionType !== undefined) updateData.transactionType = data.transactionType;
    if (data.merchantName !== undefined) updateData.merchantName = data.merchantName;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.accountName !== undefined) updateData.accountName = data.accountName;
    if (data.accountNumberLast4 !== undefined) updateData.accountNumberLast4 = data.accountNumberLast4;
    if (data.transactionDate !== undefined) updateData.transactionDate = data.transactionDate;
    if (data.availableBalance !== undefined) updateData.availableBalance = data.availableBalance;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.isFlaggedForReview !== undefined) updateData.isFlaggedForReview = data.isFlaggedForReview;

    await db.update(transactions)
      .set(updateData)
      .where(eq(transactions.id, id));

    const state = get();
    await state.fetchTransactions(state.filters);
  },

  deleteTransaction: async (id) => {
    await db.delete(transactions).where(eq(transactions.id, id));
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    }));
  },

  clearAllTransactions: async () => {
    await db.delete(transactions);
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
