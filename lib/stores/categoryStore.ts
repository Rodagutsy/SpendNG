import { create } from 'zustand';
import { getDatabase } from '../db/database';
import { Category } from '../../model_legacy/models';

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

function toRecord(c: Category): CategoryRecord {
  return {
    id: c.id,
    name: c.name,
    iconIdentifier: c.iconIdentifier,
    colorHex: c.colorHex,
    transactionTypeHint: c.transactionTypeHint as any,
    isSystem: c.isSystem,
  };
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  loading: false,
  error: null,

  fetchCategories: async () => {
    set({ loading: true, error: null });
    try {
      const db = getDatabase();
      const results = await db.get<Category>('categories').query().fetch();
      set({ categories: results.map(toRecord), loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  getCategoryById: (id) => {
    return get().categories.find((c) => c.id === id);
  },
}));
