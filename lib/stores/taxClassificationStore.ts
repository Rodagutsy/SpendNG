import { create } from 'zustand';
import { supabase } from '../supabase';

export interface TaxClassificationRecord {
  id: string;
  name: string;
  direction: 'income' | 'expense';
}

interface TaxClassificationState {
  classifications: TaxClassificationRecord[];
  loading: boolean;
  error: string | null;

  fetchClassifications: () => Promise<void>;
  getById: (id: string) => TaxClassificationRecord | undefined;
  getByDirection: (direction: 'income' | 'expense') => TaxClassificationRecord[];
}

export const useTaxClassificationStore = create<TaxClassificationState>((set, get) => ({
  classifications: [],
  loading: false,
  error: null,

  fetchClassifications: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('tax_classifications')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;

      set({
        classifications: (data || []).map((r: any) => ({
          id: r.id,
          name: r.name,
          direction: r.direction as 'income' | 'expense',
        })),
        loading: false,
      });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch tax classifications', loading: false });
    }
  },

  getById: (id) => {
    return get().classifications.find((c) => c.id === id);
  },

  getByDirection: (direction) => {
    return get().classifications.filter((c) => c.direction === direction);
  },
}));
