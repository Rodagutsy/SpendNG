import { create } from 'zustand';
import { supabase } from '../supabase';
import * as Crypto from 'expo-crypto';
import { useAuthStore } from './authStore';

export interface TransactionRecord {
  id: string;
  amount: number;
  currency: string;
  originalCurrency: string | null;
  originalAmount: number | null;
  exchangeRate: number | null;
  amountInNaira: number | null;
  rateSource: string | null;
  rateDate: number | null;
  transactionType: 'credit' | 'debit';
  merchantName: string | null;
  categoryId: string;
  accountName: string | null;
  accountNumberLast4: string | null;
  transactionDate: number;
  availableBalance: number | null;
  sourceChannel: 'sms' | 'email' | 'manual' | 'statement';
  parseConfidence: string | null;
  taxClassificationId: string | null;
  confidenceLevel: 'high' | 'medium' | 'low' | null;
  originalMessage: string | null;
  isDuplicate: boolean;
  isFlaggedForReview: boolean;
  notes: string | null;
  receiptImageUri: string | null;
  receiptPath: string | null;
  whtAmount: number | null;
  whtClientName: string | null;
  vatChargedOrDutyPaid?: boolean | null;
  businessUsePct?: number | null;
  foreignTaxWithheld?: number | null;
  payerTin?: string | null;
  isSynced: boolean;
  createdAt: number;
  updatedAt: number;
  contentHash?: string;
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
  homeTransactions: TransactionRecord[];
  loading: boolean;
  error: string | null;
  filters: TransactionFilters;

  fetchTransactions: (filters?: TransactionFilters) => Promise<void>;
  fetchHomeTransactions: () => Promise<void>;
  addTransaction: (data: Omit<TransactionRecord, 'id' | 'createdAt' | 'updatedAt' | 'isDuplicate' | 'isSynced' | 'parseConfidence' | 'contentHash' | 'originalCurrency' | 'originalAmount' | 'exchangeRate' | 'amountInNaira' | 'rateSource' | 'rateDate' | 'receiptPath'> & { contentHash: string; originalCurrency?: string | null; originalAmount?: number | null; exchangeRate?: number | null; amountInNaira?: number | null; rateSource?: string | null; rateDate?: number | null; receiptPath?: string | null }) => Promise<TransactionRecord>;
  updateCategory: (id: string, categoryId: string) => Promise<void>;
  updateNotes: (id: string, notes: string) => Promise<void>;
  updateTransaction: (id: string, data: Partial<TransactionRecord>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  clearAllTransactions: () => Promise<void>;
  setFilters: (filters: TransactionFilters) => void;
  clearFilters: () => void;
}

function getMonthStartTs(): number {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function mapRowToRecord(row: any): TransactionRecord {
  return {
    id: row.id,
    amount: row.amount,
    currency: row.currency,
    originalCurrency: row.original_currency ?? null,
    originalAmount: row.original_amount ?? null,
    exchangeRate: row.exchange_rate ?? null,
    amountInNaira: row.amount_in_naira ?? null,
    rateSource: row.rate_source ?? null,
    rateDate: row.rate_date ?? null,
    transactionType: row.transaction_type as 'credit' | 'debit',
    merchantName: row.merchant_name,
    categoryId: row.category_id,
    accountName: row.account_name,
    accountNumberLast4: row.account_number_last4,
    transactionDate: row.transaction_date,
    availableBalance: row.available_balance,
    sourceChannel: row.source_channel as TransactionRecord['sourceChannel'],
    parseConfidence: row.parse_confidence,
    taxClassificationId: row.tax_classification_id ?? null,
    confidenceLevel: row.confidence_level ?? null,
    originalMessage: row.raw_source_text,
    isDuplicate: row.is_duplicate,
    isFlaggedForReview: row.is_flagged_for_review,
    notes: row.notes,
    receiptImageUri: row.receipt_image_uri ?? null,
    receiptPath: row.receipt_path ?? null,
    whtAmount: row.wht_amount ?? null,
    whtClientName: row.wht_client_name ?? null,
    vatChargedOrDutyPaid: row.vat_charged_or_duty_paid ?? true,
    businessUsePct: row.business_use_pct != null ? Number(row.business_use_pct) : 100,
    foreignTaxWithheld: row.foreign_tax_withheld != null ? Number(row.foreign_tax_withheld) : 0,
    payerTin: row.payer_tin ?? null,
    isSynced: row.is_synced,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    contentHash: row.content_hash,
  };
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  homeTransactions: [],
  loading: false,
  error: null,
  filters: {},

  fetchTransactions: async (filters) => {
    set({ loading: true, error: null });
    try {
      const userId = useAuthStore.getState().userId;
      if (!userId) {
        set({ transactions: [], loading: false });
        return;
      }
      const activeFilters = filters || get().filters;
      let query = supabase.from('transactions').select('*').eq('user_id', userId);

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

    if (error) {
      if (error.code === '23505') {
        throw new Error('This transaction already exists');
      }
      throw error;
    }

      const txs: TransactionRecord[] = (data || []).map(mapRowToRecord);
      set({ transactions: txs, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch transactions', loading: false });
    }
  },

  fetchHomeTransactions: async () => {
    try {
      const userId = useAuthStore.getState().userId;
      if (!userId) return;
      let query = supabase.from('transactions').select('*').eq('user_id', userId);
      query = query.order('transaction_date', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      const txs: TransactionRecord[] = (data || []).map(mapRowToRecord);
      set({ homeTransactions: txs });
    } catch (err: any) {
      console.error('fetchHomeTransactions error:', err?.message || err);
      set({ error: err.message || 'Failed to fetch transactions', loading: false });
    }
  },

  addTransaction: async (data) => {
    const newId = Crypto.randomUUID();
    const nowTs = Date.now();
    const userId = useAuthStore.getState().userId;
    const { contentHash } = data;

    const insertData = {
      id: newId,
      user_id: userId,
      amount: data.amount,
      currency: data.currency,
      original_currency: data.originalCurrency ?? null,
      original_amount: data.originalAmount ?? null,
      exchange_rate: data.exchangeRate ?? null,
      amount_in_naira: data.amountInNaira ?? null,
      rate_source: data.rateSource ?? null,
      rate_date: data.rateDate ?? null,
      transaction_type: data.transactionType,
      merchant_name: data.merchantName,
      category_id: data.categoryId,
      account_name: data.accountName,
      account_number_last4: data.accountNumberLast4,
      transaction_date: data.transactionDate,
      available_balance: data.availableBalance,
      source_channel: data.sourceChannel,
      raw_source_text: data.originalMessage,
      content_hash: contentHash,
      parse_confidence: null,
      confidence_level: data.confidenceLevel ?? null,
      receipt_image_uri: data.receiptImageUri ?? null,
      receipt_path: data.receiptPath ?? null,
      wht_amount: data.whtAmount ?? null,
      wht_client_name: data.whtClientName ?? null,
      vat_charged_or_duty_paid: data.vatChargedOrDutyPaid ?? true,
      business_use_pct: data.businessUsePct ?? 100,
      foreign_tax_withheld: data.foreignTaxWithheld ?? 0,
      payer_tin: data.payerTin ?? null,
      tax_classification_id: data.taxClassificationId ?? null,
      is_duplicate: false,
      is_flagged_for_review: data.isFlaggedForReview || false,
      notes: data.notes,
      is_synced: true,
      created_at: nowTs,
      updated_at: nowTs,
    };

    const { data: inserted, error } = await supabase
      .from('transactions')
      .insert(insertData)
      .select();

    if (error) throw error;

    const added = mapRowToRecord(inserted[0]);
    set((state) => ({
      transactions: [added, ...state.transactions],
      homeTransactions: [added, ...state.homeTransactions],
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
      homeTransactions: state.homeTransactions.map((t) =>
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
      homeTransactions: state.homeTransactions.map((t) =>
        t.id === id ? { ...t, notes, updatedAt: nowTs } : t
      ),
    }));
  },

  updateTransaction: async (id, data) => {
    const nowTs = Date.now();
    const updateData: any = { updated_at: nowTs };
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.originalCurrency !== undefined) updateData.original_currency = data.originalCurrency;
    if (data.originalAmount !== undefined) updateData.original_amount = data.originalAmount;
    if (data.exchangeRate !== undefined) updateData.exchange_rate = data.exchangeRate;
    if (data.amountInNaira !== undefined) updateData.amount_in_naira = data.amountInNaira;
    if (data.rateSource !== undefined) updateData.rate_source = data.rateSource;
    if (data.rateDate !== undefined) updateData.rate_date = data.rateDate;
    if (data.transactionType !== undefined) updateData.transaction_type = data.transactionType;
    if (data.merchantName !== undefined) updateData.merchant_name = data.merchantName;
    if (data.categoryId !== undefined) updateData.category_id = data.categoryId;
    if (data.accountName !== undefined) updateData.account_name = data.accountName;
    if (data.accountNumberLast4 !== undefined) updateData.account_number_last4 = data.accountNumberLast4;
    if (data.transactionDate !== undefined) updateData.transaction_date = data.transactionDate;
    if (data.availableBalance !== undefined) updateData.available_balance = data.availableBalance;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.isFlaggedForReview !== undefined) updateData.is_flagged_for_review = data.isFlaggedForReview;
    if (data.isDuplicate !== undefined) updateData.is_duplicate = data.isDuplicate;
    if (data.confidenceLevel !== undefined) updateData.confidence_level = data.confidenceLevel;
    if (data.receiptImageUri !== undefined) updateData.receipt_image_uri = data.receiptImageUri;
    if (data.receiptPath !== undefined) updateData.receipt_path = data.receiptPath;
    if (data.whtAmount !== undefined) updateData.wht_amount = data.whtAmount;
    if (data.whtClientName !== undefined) updateData.wht_client_name = data.whtClientName;
    if (data.vatChargedOrDutyPaid !== undefined) updateData.vat_charged_or_duty_paid = data.vatChargedOrDutyPaid;
    if (data.businessUsePct !== undefined) updateData.business_use_pct = data.businessUsePct;
    if (data.foreignTaxWithheld !== undefined) updateData.foreign_tax_withheld = data.foreignTaxWithheld;
    if (data.payerTin !== undefined) updateData.payer_tin = data.payerTin;
    if (data.taxClassificationId !== undefined) updateData.tax_classification_id = data.taxClassificationId;

    const { error } = await supabase.from('transactions')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;

    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? { ...t, ...data, updatedAt: nowTs } : t
      ),
      homeTransactions: state.homeTransactions.map((t) =>
        t.id === id ? { ...t, ...data, updatedAt: nowTs } : t
      ),
    }));
  },

  deleteTransaction: async (id) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw error;

    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
      homeTransactions: state.homeTransactions.filter((t) => t.id !== id),
    }));
  },

  clearAllTransactions: async () => {
    const userId = useAuthStore.getState().userId;
    if (!userId) throw new Error('No authenticated user');
    const { error } = await supabase.from('transactions').delete().eq('user_id', userId);
    if (error) throw error;

    set({ transactions: [], homeTransactions: [] });
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
  const transactions = useTransactionStore((s) => s.homeTransactions);
  const monthStartTs = getMonthStartTs();
  const thisMonth = transactions.filter((t) => !t.isDuplicate && t.transactionDate >= monthStartTs);

  const moneyIn = thisMonth
    .filter((t) => t.transactionType === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);

  const moneyOut = thisMonth
    .filter((t) => t.transactionType === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = moneyIn - moneyOut;
  return { moneyIn, moneyOut, netBalance, transactionCount: thisMonth.length };
}
