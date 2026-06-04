import { create } from 'zustand';

export interface CategoryRecord {
  id: string;
  name: string;
  iconIdentifier: string;
  colorHex: string;
  transactionTypeHint: 'credit' | 'debit' | 'both';
  isSystem: boolean;
}

interface CategoryState {
  categories: CategoryRecord[];
  loading: boolean;
  error: string | null;

  fetchCategories: () => Promise<void>;
  getCategoryById: (id: string) => CategoryRecord | undefined;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  loading: false,
  error: null,

  fetchCategories: async () => {
    set({ loading: false, error: null });
    console.log('[CategoryStore] WatermelonDB disabled – fetchCategories stub called');
  },

  getCategoryById: (id) => {
    return get().categories.find((c) => c.id === id);
  },
}));
