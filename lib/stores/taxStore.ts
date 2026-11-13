import { create } from 'zustand';
import { supabase } from '../supabase';
import { useAuthStore } from './authStore';

export interface WhtCredit {
  id: string;
  taxYear?: number;
  clientName: string;
  payerTin?: string | null;
  grossAmount: number;
  whtRate?: number | null;
  whtAmount: number;
  netAmount: number;
  transactionDate: number;
  transactionId: string | null;
  creditNoteRef?: string | null;
}

interface TaxStep {
  done: boolean;
  flaggedCount: number;
}

interface TaxState {
  taxYear: number;
  steps: [TaxStep, TaxStep, TaxStep, TaxStep];
  whtCredits: WhtCredit[];
  setTaxYear: (year: number) => void;
  setStepDone: (index: 0 | 1 | 2 | 3, done: boolean) => void;
  setStepFlagged: (index: 0 | 1 | 2 | 3, count: number) => void;
  fetchWhtCredits: (taxYear?: number) => Promise<void>;
  addWhtCredit: (credit: WhtCredit) => Promise<void>;
  removeWhtCredit: (id: string) => Promise<void>;
  resetReview: () => void;
}

const defaultSteps: [TaxStep, TaxStep, TaxStep, TaxStep] = [
  { done: false, flaggedCount: 0 },
  { done: false, flaggedCount: 0 },
  { done: false, flaggedCount: 0 },
  { done: false, flaggedCount: 0 },
];

export const useTaxStore = create<TaxState>((set) => ({
  taxYear: new Date().getFullYear(),
  steps: defaultSteps,
  whtCredits: [],

  setTaxYear: (year) => set({ taxYear: year }),

  setStepDone: (index, done) =>
    set((state) => {
      const steps = [...state.steps] as [TaxStep, TaxStep, TaxStep, TaxStep];
      steps[index] = { ...steps[index], done };
      return { steps };
    }),

  setStepFlagged: (index, count) =>
    set((state) => {
      const steps = [...state.steps] as [TaxStep, TaxStep, TaxStep, TaxStep];
      steps[index] = { ...steps[index], flaggedCount: count };
      return { steps };
    }),

  fetchWhtCredits: async (taxYear) => {
    const userId = useAuthStore.getState().userId;
    if (!userId) return;
    let query = supabase.from('wht_credits').select('*').eq('user_id', userId);
    if (taxYear !== undefined) {
      query = query.eq('tax_year', taxYear);
    }
    const { data, error } = await query.order('transaction_date', { ascending: false });
    if (error) {
      console.error('fetchWhtCredits error:', error.message);
      return;
    }
    set({
      whtCredits: (data ?? []).map((r: any) => ({
        id: r.id,
        taxYear: r.tax_year,
        clientName: r.client_name,
        payerTin: r.payer_tin ?? null,
        grossAmount: Number(r.gross_amount),
        whtRate: r.wht_rate != null ? Number(r.wht_rate) : null,
        whtAmount: Number(r.wht_amount),
        netAmount: Number(r.net_amount),
        transactionDate: Number(r.transaction_date),
        transactionId: r.transaction_id ?? null,
        creditNoteRef: r.credit_note_ref ?? null,
      })),
    });
  },

  addWhtCredit: async (credit) => {
    const userId = useAuthStore.getState().userId;
    const year = credit.taxYear ?? new Date(credit.transactionDate).getFullYear();
    set((state) => ({
      whtCredits: [...state.whtCredits, { ...credit, taxYear: year }],
    }));
    if (!userId) return;
    const { error } = await supabase.from('wht_credits').insert({
      id: credit.id,
      user_id: userId,
      tax_year: year,
      transaction_id: credit.transactionId ?? null,
      client_name: credit.clientName,
      payer_tin: credit.payerTin ?? null,
      gross_amount: credit.grossAmount,
      wht_rate: credit.whtRate ?? null,
      wht_amount: credit.whtAmount,
      net_amount: credit.netAmount,
      transaction_date: credit.transactionDate,
      credit_note_ref: credit.creditNoteRef ?? null,
    });
    if (error) console.error('addWhtCredit error:', error.message);
  },

  removeWhtCredit: async (id) => {
    set((state) => ({
      whtCredits: state.whtCredits.filter((c) => c.id !== id),
    }));
    const userId = useAuthStore.getState().userId;
    if (!userId) return;
    const { error } = await supabase.from('wht_credits').delete().eq('id', id);
    if (error) console.error('removeWhtCredit error:', error.message);
  },

  resetReview: () =>
    set({ steps: defaultSteps }),
}));
