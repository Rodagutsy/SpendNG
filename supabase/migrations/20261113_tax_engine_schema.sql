-- Phase 2: Nigerian PIT Tax Engine Schema, Profiles, Capital Assets & WHT Credits

-- 1. Taxpayer Profiles (1 per user, PIT-focused v1)
CREATE TABLE IF NOT EXISTS public.tax_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    income_streams TEXT[] NOT NULL DEFAULT ARRAY['employment_paye']::TEXT[],
    state_of_residence TEXT NOT NULL DEFAULT 'Lagos',
    tax_id TEXT,
    is_tenant BOOLEAN NOT NULL DEFAULT true,
    annual_rent_override NUMERIC(15,2),
    paye_deducted_override NUMERIC(15,2),
    pension_override NUMERIC(15,2),
    nhf_override NUMERIC(15,2),
    nhis_override NUMERIC(15,2),
    life_assurance_override NUMERIC(15,2),
    mortgage_interest_override NUMERIC(15,2),
    prior_year_business_loss NUMERIC(15,2) NOT NULL DEFAULT 0,
    prior_year_digital_asset_loss NUMERIC(15,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tax_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own tax profile" ON public.tax_profiles;
CREATE POLICY "Users can manage own tax profile"
    ON public.tax_profiles
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 2. Capital Assets Register (NTA First Schedule, Part I, Table I)
CREATE TABLE IF NOT EXISTS public.capital_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    asset_class TEXT NOT NULL CHECK (asset_class IN ('class_1_10pct', 'class_2_20pct', 'class_3_25pct')),
    cost NUMERIC(15,2) NOT NULL CHECK (cost >= 0),
    purchase_date BIGINT NOT NULL,
    vat_paid BOOLEAN NOT NULL DEFAULT true,
    business_use_pct NUMERIC(5,2) NOT NULL DEFAULT 100 CHECK (business_use_pct >= 0 AND business_use_pct <= 100),
    years_previously_claimed INTEGER NOT NULL DEFAULT 0 CHECK (years_previously_claimed >= 0),
    disposed_at BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_capital_assets_user ON public.capital_assets(user_id);

ALTER TABLE public.capital_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own capital assets" ON public.capital_assets;
CREATE POLICY "Users can manage own capital assets"
    ON public.capital_assets
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 3. Persistent Withholding Tax (WHT) Credits (NTAA s. 51)
CREATE TABLE IF NOT EXISTS public.wht_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tax_year INTEGER NOT NULL,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    payer_tin TEXT,
    gross_amount NUMERIC(15,2) NOT NULL CHECK (gross_amount >= 0),
    wht_rate NUMERIC(5,2),
    wht_amount NUMERIC(15,2) NOT NULL CHECK (wht_amount >= 0),
    net_amount NUMERIC(15,2) NOT NULL,
    transaction_date BIGINT NOT NULL,
    credit_note_ref TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wht_credits_user_year ON public.wht_credits(user_id, tax_year);

ALTER TABLE public.wht_credits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own wht credits" ON public.wht_credits;
CREATE POLICY "Users can manage own wht credits"
    ON public.wht_credits
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. Extend tax_classifications with NTA 2025 income streams & personal reliefs
INSERT INTO public.tax_classifications (id, name, direction) VALUES
  ('creator-platform', 'Creator Platform Payout', 'income'),
  ('brand-deal', 'Brand Deal / Sponsorship', 'income'),
  ('digital-asset-gain', 'Digital Asset Gain', 'income'),
  ('final-wht-interest', 'Final-WHT Bond/Security Interest', 'income'),
  ('digital-asset-loss', 'Digital Asset Loss (Ring-Fenced)', 'expense'),
  ('rent-paid', 'Rent Paid (Rent Relief)', 'expense'),
  ('pension-contribution', 'Pension Contribution (PRA)', 'expense'),
  ('nhf-contribution', 'National Housing Fund (NHF)', 'expense'),
  ('nhis-hmo', 'Health Insurance (NHIS / HMO)', 'expense'),
  ('life-assurance', 'Life Assurance / Annuity', 'expense'),
  ('mortgage-interest', 'Owner-Occupied Mortgage Interest', 'expense')
ON CONFLICT (id) DO NOTHING;

-- Update rent default to map to rent-paid for Rent Relief tracking
UPDATE public.category_tax_defaults
SET default_tax_classification_id = 'rent-paid'
WHERE category_id = 'rent';

-- 5. Extend transactions table with tax-compliance metadata
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS vat_charged_or_duty_paid BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS business_use_pct NUMERIC(5,2) DEFAULT 100,
  ADD COLUMN IF NOT EXISTS foreign_tax_withheld NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payer_tin TEXT;

