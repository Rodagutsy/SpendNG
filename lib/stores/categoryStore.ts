import { create } from 'zustand';
import { supabase } from '../supabase';

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
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;

      const categories: CategoryRecord[] = (data || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        iconIdentifier: r.icon_identifier,
        colorHex: r.color_hex,
        transactionTypeHint: r.transaction_type_hint as 'credit' | 'debit' | 'both',
        isSystem: r.is_system,
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
