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

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  loading: false,
  error: null,

  fetchCategories: async () => {
    set({ loading: true, error: null });
    try {
      const db = getDatabase();
      const records = await db.get<Category>('categories').query().fetch();
      const categories: CategoryRecord[] = records.map((r) => ({
        id: r.id,
        name: r.name,
        iconIdentifier: r.iconIdentifier,
        colorHex: r.colorHex,
        transactionTypeHint: r.transactionTypeHint,
        isSystem: r.isSystem,
      }));
      set({ categories, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch categories', loading: false });
    }
  },

  getCategoryById: (id) => {
    return get().categories.find((c) => c.id === id);
  },
}));
