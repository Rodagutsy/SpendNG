import { create } from 'zustand';
import { supabase } from '../supabase';

export interface CategoryDefaultRecord {
  categoryId: string;
  defaultTaxClassificationId: string;
  userCanOverride: boolean;
}

interface CategoryDefaultState {
  defaults: CategoryDefaultRecord[];
  loading: boolean;
  error: string | null;

  fetchDefaults: () => Promise<void>;
  getDefaultForCategory: (categoryId: string) => CategoryDefaultRecord | undefined;
}

export const useCategoryDefaultStore = create<CategoryDefaultState>((set, get) => ({
  defaults: [],
  loading: false,
  error: null,

  fetchDefaults: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('category_tax_defaults')
        .select('*')
        .order('category_id', { ascending: true });

      if (error) throw error;

      set({
        defaults: (data || []).map((r: any) => ({
          categoryId: r.category_id,
          defaultTaxClassificationId: r.default_tax_classification_id,
          userCanOverride: r.user_can_override,
        })),
        loading: false,
      });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch category defaults', loading: false });
    }
  },

  getDefaultForCategory: (categoryId) => {
    return get().defaults.find((d) => d.categoryId === categoryId);
  },
}));
