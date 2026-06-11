import { create } from 'zustand';
import { supabase } from '../supabase';
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
  taxClassificationId: string | null;
  confidenceLevel: 'high' | 'medium' | 'low' | null;
  originalMessage: string | null;
  isDuplicate: boolean;
  isFlaggedForReview: boolean;
  notes: string | null;
  receiptImageUri: string | null;
  whtAmount: number | null;
  whtClientName: string | null;
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
  addTransaction: (data: Omit<TransactionRecord, 'id' | 'createdAt' | 'updatedAt' | 'isDuplicate' | 'isSynced' | 'parseConfidence' | 'whtAmount' | 'whtClientName'>) => Promise<TransactionRecord>;
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

function mapRowToRecord(row: any): TransactionRecord {
  return {
    id: row.id,
    amount: row.amount,
    currency: row.currency,
    transactionType: row.transaction_type as 'credit' | 'debit',
    merchantName: row.merchant_name,
    categoryId: row.category_id,
    accountName: row.account_name,
    accountNumberLast4: row.account_number_last4,
    transactionDate: row.transaction_date,
    availableBalance: row.available_balance,
    sourceChannel: row.source_channel as 'sms' | 'email' | 'manual',
    parseConfidence: row.parse_confidence,
    taxClassificationId: row.tax_classification_id ?? null,
    confidenceLevel: null,
    originalMessage: row.raw_source_text,
    isDuplicate: row.is_duplicate,
    isFlaggedForReview: row.is_flagged_for_review,
    notes: row.notes,
    receiptImageUri: null,
    whtAmount: null,
    whtClientName: null,
    isSynced: row.is_synced,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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
      const activeFilters = filters || get().filters;
      let query = supabase.from('transactions').select('*');

      if (activeFilters.categoryId) {
        query = query.eq('category_id', activeFilters.categoryId);
      }
      if (activeFilters.transactionType) {
        query = query.eq('transaction_type', activeFilters.transactionType);
      }
      if (activeFilters.startDate) {
        query = query.gte('transaction_date', activeFilters.startDate);
      }
      if (activeFilters.endDate) {
        query = query.lte('transaction_date', activeFilters.endDate);
      }
      if (activeFilters.sourceChannel) {
        query = query.eq('source_channel', activeFilters.sourceChannel);
      }
      if (activeFilters.needsReview !== undefined) {
        query = query.eq('is_flagged_for_review', activeFilters.needsReview);
      }
      if (activeFilters.keyword) {
        query = query.or(`merchant_name.ilike.%${activeFilters.keyword}%,notes.ilike.%${activeFilters.keyword}%`);
      }

      query = query.order('transaction_date', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      const txs: TransactionRecord[] = (data || []).map(mapRowToRecord);
      set({ transactions: txs, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch transactions', loading: false });
    }
  },

  addTransaction: async (data) => {
    const newId = Crypto.randomUUID();
    const nowTs = Date.now();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('transactions').insert({
      id: newId,
      user_id: user?.id,
      amount: data.amount,
      currency: data.currency,
      transaction_type: data.transactionType,
      merchant_name: data.merchantName,
      category_id: data.categoryId,
      account_name: data.accountName,
      account_number_last4: data.accountNumberLast4,
      transaction_date: data.transactionDate,
      available_balance: data.availableBalance,
      source_channel: data.sourceChannel,
      raw_source_text: data.originalMessage,
      parse_confidence: null,
      is_duplicate: false,
      is_flagged_for_review: data.isFlaggedForReview || false,
      notes: data.notes,
      is_synced: true,
      created_at: nowTs,
      updated_at: nowTs,
    });

    if (error) throw error;

    const added: TransactionRecord = {
      ...data,
      id: newId,
      parseConfidence: null,
      taxClassificationId: null,
      confidenceLevel: null,
      isDuplicate: false,
      isFlaggedForReview: data.isFlaggedForReview || false,
      receiptImageUri: null,
      whtAmount: null,
      whtClientName: null,
      isSynced: true,
      createdAt: nowTs,
      updatedAt: nowTs,
    };

    set((state) => ({
      transactions: [added, ...state.transactions],
    }));

    return added;
  },

  updateCategory: async (id, categoryId) => {
    const nowTs = Date.now();
    const { error } = await supabase.from('transactions')
      .update({ category_id: categoryId, updated_at: nowTs })
      .eq('id', id);

    if (error) throw error;

    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? { ...t, categoryId, updatedAt: nowTs } : t
      ),
    }));
  },

  updateNotes: async (id, notes) => {
    const nowTs = Date.now();
    const { error } = await supabase.from('transactions')
      .update({ notes, updated_at: nowTs })
      .eq('id', id);

    if (error) throw error;

    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? { ...t, notes, updatedAt: nowTs } : t
      ),
    }));
  },

  updateTransaction: async (id, data) => {
    const nowTs = Date.now();
    const updateData: any = { updated_at: nowTs };
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.transactionType !== undefined) updateData.transaction_type = data.transactionType;
    if (data.merchantName !== undefined) updateData.merchant_name = data.merchantName;
    if (data.categoryId !== undefined) updateData.category_id = data.categoryId;
    if (data.accountName !== undefined) updateData.account_name = data.accountName;
    if (data.accountNumberLast4 !== undefined) updateData.account_number_last4 = data.accountNumberLast4;
    if (data.transactionDate !== undefined) updateData.transaction_date = data.transactionDate;
    if (data.availableBalance !== undefined) updateData.available_balance = data.availableBalance;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.isFlaggedForReview !== undefined) updateData.is_flagged_for_review = data.isFlaggedForReview;

    const { error } = await supabase.from('transactions')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;

    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? { ...t, ...data, updatedAt: nowTs } : t
      ),
    }));
  },

  deleteTransaction: async (id) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw error;

    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    }));
  },

  clearAllTransactions: async () => {
    const { error } = await supabase.from('transactions').delete().neq('id', '');
    if (error) throw error;

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
