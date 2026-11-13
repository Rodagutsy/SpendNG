import { create } from 'zustand';
import * as Crypto from 'expo-crypto';
import { supabase } from '../supabase';
import { useAuthStore } from './authStore';
import type {
  CapitalAssetClass,
  CapitalAssetInput,
  IncomeStream,
  TaxProfileInput,
} from '../tax-engine';

export interface TaxProfileRecord extends TaxProfileInput {
  stateOfResidence: string;
  taxId: string | null;
}

export interface CapitalAssetRecord extends CapitalAssetInput {
  transactionId: string | null;
}

export const DEFAULT_TAX_PROFILE: TaxProfileRecord = {
  incomeStreams: ['employment_paye'],
  stateOfResidence: 'Lagos',
  taxId: null,
  isTenant: true,
  annualRentOverride: null,
  payeDeductedOverride: null,
  pensionOverride: null,
  nhfOverride: null,
  nhisOverride: null,
  lifeAssuranceOverride: null,
  mortgageInterestOverride: null,
  priorYearBusinessLoss: 0,
  priorYearDigitalAssetLoss: 0,
};

interface TaxProfileState {
  profile: TaxProfileRecord;
  assets: CapitalAssetRecord[];
  loading: boolean;
  error: string | null;

  fetchProfileAndAssets: () => Promise<void>;
  saveProfile: (patch: Partial<TaxProfileRecord>) => Promise<void>;
  addAsset: (asset: Omit<CapitalAssetRecord, 'id'>) => Promise<CapitalAssetRecord>;
  updateAsset: (id: string, patch: Partial<CapitalAssetRecord>) => Promise<void>;
  removeAsset: (id: string) => Promise<void>;
}

function mapProfileRow(row: any): TaxProfileRecord {
  return {
    incomeStreams: (row.income_streams ?? ['employment_paye']) as IncomeStream[],
    stateOfResidence: row.state_of_residence ?? 'Lagos',
    taxId: row.tax_id ?? null,
    isTenant: row.is_tenant ?? true,
    annualRentOverride: row.annual_rent_override != null ? Number(row.annual_rent_override) : null,
    payeDeductedOverride: row.paye_deducted_override != null ? Number(row.paye_deducted_override) : null,
    pensionOverride: row.pension_override != null ? Number(row.pension_override) : null,
    nhfOverride: row.nhf_override != null ? Number(row.nhf_override) : null,
    nhisOverride: row.nhis_override != null ? Number(row.nhis_override) : null,
    lifeAssuranceOverride: row.life_assurance_override != null ? Number(row.life_assurance_override) : null,
    mortgageInterestOverride: row.mortgage_interest_override != null ? Number(row.mortgage_interest_override) : null,
    priorYearBusinessLoss: Number(row.prior_year_business_loss ?? 0),
    priorYearDigitalAssetLoss: Number(row.prior_year_digital_asset_loss ?? 0),
  };
}

function mapAssetRow(row: any): CapitalAssetRecord {
  return {
    id: row.id,
    transactionId: row.transaction_id ?? null,
    name: row.name,
    assetClass: row.asset_class as CapitalAssetClass,
    cost: Number(row.cost),
    purchaseDate: Number(row.purchase_date),
    vatPaid: row.vat_paid ?? true,
    businessUsePct: Number(row.business_use_pct ?? 100),
    yearsPreviouslyClaimed: Number(row.years_previously_claimed ?? 0),
    disposedAt: row.disposed_at != null ? Number(row.disposed_at) : null,
  };
}

export const useTaxProfileStore = create<TaxProfileState>((set, get) => ({
  profile: DEFAULT_TAX_PROFILE,
  assets: [],
  loading: false,
  error: null,

  fetchProfileAndAssets: async () => {
    const userId = useAuthStore.getState().userId;
    if (!userId) return;
    set({ loading: true, error: null });
    try {
      const [profileRes, assetsRes] = await Promise.all([
        supabase.from('tax_profiles').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('capital_assets').select('*').eq('user_id', userId).order('purchase_date', { ascending: false }),
      ]);

      if (profileRes.error) throw profileRes.error;
      if (assetsRes.error) throw assetsRes.error;

      set({
        profile: profileRes.data ? mapProfileRow(profileRes.data) : DEFAULT_TAX_PROFILE,
        assets: (assetsRes.data ?? []).map(mapAssetRow),
        loading: false,
      });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load tax profile', loading: false });
    }
  },

  saveProfile: async (patch) => {
    const userId = useAuthStore.getState().userId;
    const next = { ...get().profile, ...patch };
    set({ profile: next });
    if (!userId) return;

    const { error } = await supabase.from('tax_profiles').upsert(
      {
        user_id: userId,
        income_streams: next.incomeStreams,
        state_of_residence: next.stateOfResidence,
        tax_id: next.taxId,
        is_tenant: next.isTenant,
        annual_rent_override: next.annualRentOverride,
        paye_deducted_override: next.payeDeductedOverride,
        pension_override: next.pensionOverride,
        nhf_override: next.nhfOverride,
        nhis_override: next.nhisOverride,
        life_assurance_override: next.lifeAssuranceOverride,
        mortgage_interest_override: next.mortgageInterestOverride,
        prior_year_business_loss: next.priorYearBusinessLoss ?? 0,
        prior_year_digital_asset_loss: next.priorYearDigitalAssetLoss ?? 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
    if (error) throw error;
  },

  addAsset: async (asset) => {
    const userId = useAuthStore.getState().userId;
    const id = Crypto.randomUUID();
    const record: CapitalAssetRecord = { ...asset, id };
    set((s) => ({ assets: [record, ...s.assets] }));

    if (userId) {
      const { error } = await supabase.from('capital_assets').insert({
        id,
        user_id: userId,
        transaction_id: asset.transactionId ?? null,
        name: asset.name,
        asset_class: asset.assetClass,
        cost: asset.cost,
        purchase_date: asset.purchaseDate,
        vat_paid: asset.vatPaid,
        business_use_pct: asset.businessUsePct ?? 100,
        years_previously_claimed: asset.yearsPreviouslyClaimed ?? 0,
        disposed_at: asset.disposedAt ?? null,
      });
      if (error) throw error;
    }
    return record;
  },

  updateAsset: async (id, patch) => {
    set((s) => ({
      assets: s.assets.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));
    const dbPatch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.assetClass !== undefined) dbPatch.asset_class = patch.assetClass;
    if (patch.cost !== undefined) dbPatch.cost = patch.cost;
    if (patch.purchaseDate !== undefined) dbPatch.purchase_date = patch.purchaseDate;
    if (patch.vatPaid !== undefined) dbPatch.vat_paid = patch.vatPaid;
    if (patch.businessUsePct !== undefined) dbPatch.business_use_pct = patch.businessUsePct;
    if (patch.yearsPreviouslyClaimed !== undefined) dbPatch.years_previously_claimed = patch.yearsPreviouslyClaimed;
    if (patch.disposedAt !== undefined) dbPatch.disposed_at = patch.disposedAt;

    const { error } = await supabase.from('capital_assets').update(dbPatch).eq('id', id);
    if (error) throw error;
  },

  removeAsset: async (id) => {
    set((s) => ({ assets: s.assets.filter((a) => a.id !== id) }));
    const { error } = await supabase.from('capital_assets').delete().eq('id', id);
    if (error) throw error;
  },
}));

