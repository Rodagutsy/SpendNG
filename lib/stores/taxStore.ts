import { create } from 'zustand';

export interface WhtCredit {
  id: string;
  clientName: string;
  grossAmount: number;
  whtAmount: number;
  netAmount: number;
  transactionDate: number;
  transactionId: string | null;
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
  addWhtCredit: (credit: WhtCredit) => void;
  removeWhtCredit: (id: string) => void;
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

  addWhtCredit: (credit) =>
    set((state) => ({
      whtCredits: [...state.whtCredits, credit],
    })),

  removeWhtCredit: (id) =>
    set((state) => ({
      whtCredits: state.whtCredits.filter((c) => c.id !== id),
    })),

  resetReview: () =>
    set({ steps: defaultSteps, whtCredits: [] }),
}));
