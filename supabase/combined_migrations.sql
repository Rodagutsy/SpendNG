-- ========================================
-- 20260507_init.sql
-- ========================================

-- SpendNG Remote Database Initial Schema

-- 1. Tables

-- categories
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon_identifier VARCHAR(50) NOT NULL,
    color_hex CHAR(7) NOT NULL,
    transaction_type_hint VARCHAR(10) CHECK (transaction_type_hint IN ('credit', 'debit', 'both')),
    is_system BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- transactions
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    currency CHAR(3) DEFAULT 'NGN',
    transaction_type VARCHAR(10) CHECK (transaction_type IN ('credit', 'debit')),
    merchant_name VARCHAR(255),
    category_id TEXT REFERENCES public.categories(id),
    account_name VARCHAR(100),
    account_number_last4 CHAR(4),
    transaction_date TIMESTAMPTZ NOT NULL,
    available_balance DECIMAL(15,2),
    source_channel VARCHAR(10) CHECK (source_channel IN ('sms', 'email', 'manual')),
    raw_source_text TEXT,
    content_hash VARCHAR(64),
    parse_confidence VARCHAR(10),
    is_duplicate BOOLEAN DEFAULT false,
    is_flagged_for_review BOOLEAN DEFAULT false,
    is_synced BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- rules
CREATE TABLE IF NOT EXISTS public.rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    keyword VARCHAR(255) NOT NULL,
    match_type VARCHAR(20) CHECK (match_type IN ('exact', 'contains', 'starts_with', 'regex')),
    category_id TEXT REFERENCES public.categories(id),
    priority INTEGER DEFAULT 0,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    last_applied_at TIMESTAMPTZ
);

-- sync_logs
CREATE TABLE IF NOT EXISTS public.sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    source_channel VARCHAR(10),
    sender_identifier VARCHAR(100),
    raw_content_hash CHAR(64),
    parse_status VARCHAR(20),
    transaction_id UUID REFERENCES public.transactions(id),
    failure_reason TEXT,
    processed_at TIMESTAMPTZ DEFAULT now()
);

-- failed_parses
CREATE TABLE IF NOT EXISTS public.failed_parses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    source_channel VARCHAR(10),
    sender_identifier VARCHAR(100),
    raw_content TEXT,
    failure_reason TEXT,
    is_reviewed BOOLEAN DEFAULT false,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Row Level Security (RLS)

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.failed_parses ENABLE ROW LEVEL SECURITY;

-- Policies (with explicit WITH CHECK for INSERT/UPDATE)
CREATE POLICY "Users can access their own transactions"
ON public.transactions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can access their own rules"
ON public.rules FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can access their own sync logs"
ON public.sync_logs FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can access their own failed parses"
ON public.failed_parses FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can read system categories"
ON public.categories FOR SELECT
USING (is_system = true OR auth.uid() IS NOT NULL);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_rules_user_id ON public.rules(user_id);
CREATE INDEX IF NOT EXISTS idx_rules_priority ON public.rules(priority);



-- ========================================
-- 20260610_fix_rls_insert.sql
-- ========================================

-- NOTE: This migration is superseded by 20260507_init.sql (v2).
-- RLS policies and WITH CHECK clauses are now defined directly in init.sql.
-- Keep this file only for existing databases that ran the original init.sql.
-- New deployments can skip this migration.

-- Add INSERT policy for transactions to fix RLS violation
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;
CREATE POLICY "Users can insert their own transactions" ON public.transactions
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Also add WITH CHECK for UPDATE on the existing policy
DROP POLICY IF EXISTS "Users can only access their own transactions" ON public.transactions;
CREATE POLICY "Users can only access their own transactions" ON public.transactions
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);




-- ========================================
-- seed_categories.sql
-- ========================================
-- Seed default categories for SpendNG
INSERT INTO public.categories (id, name, icon_identifier, color_hex, transaction_type_hint, is_system, created_at) VALUES
  -- Expense categories
  ('food-dining', 'Food & Dining', 'utensils', '#FF6B6B', 'debit', true, now()),
  ('transport', 'Transport', 'car', '#4ECDC4', 'debit', true, now()),
  ('airtime-data', 'Airtime & Data', 'wifi', '#45B7D1', 'debit', true, now()),
  ('shopping', 'Shopping', 'shopping-bag', '#96CEB4', 'debit', true, now()),
  ('utilities', 'Utilities', 'bolt', '#FFEAA7', 'debit', true, now()),
  ('rent', 'Rent', 'home', '#DDA0DD', 'debit', true, now()),
  ('business-expense', 'Business Expense', 'briefcase', '#98D8C8', 'debit', true, now()),
  ('health', 'Health', 'stethoscope', '#F7DC6F', 'debit', true, now()),
  ('education', 'Education', 'graduation-cap', '#BB8FCE', 'debit', true, now()),
  ('transfer-sent', 'Transfer Sent', 'arrow.up.right', '#C5C3BF', 'debit', true, now()),
  ('entertainment', 'Entertainment', 'clapperboard', '#CC99FF', 'debit', true, now()),
  ('other-expense', 'Other Expense', 'tag.fill', '#ADAAA4', 'debit', true, now()),
  -- Income categories
  ('salary', 'Salary', 'wallet', '#2ECC71', 'credit', true, now()),
  ('business-income', 'Business Income', 'briefcase', '#3498DB', 'credit', true, now()),
  ('freelance', 'Freelance', 'laptop', '#E67E22', 'credit', true, now()),
  ('gifts', 'Gifts', 'card-giftcard', '#E74C3C', 'credit', true, now()),
  ('other-income', 'Other Income', 'tag.fill', '#95A5A6', 'credit', true, now())
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 20260611_tax_classification_system.sql
-- ========================================

-- SpendNG Tax Classification System
-- Run this in your Supabase SQL editor.

-- 1. tax_classifications lookup table
CREATE TABLE IF NOT EXISTS public.tax_classifications (
    id TEXT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    direction VARCHAR(10) CHECK (direction IN ('income', 'expense')) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.tax_classifications (id, name, direction) VALUES
  ('employment-income', 'Employment Income', 'income'),
  ('business-income', 'Business Income', 'income'),
  ('freelance-income', 'Freelance Income', 'income'),
  ('investment-income', 'Investment Income', 'income'),
  ('rental-income', 'Rental Income', 'income'),
  ('other-taxable-income', 'Other Taxable Income', 'income'),
  ('non-taxable-receipt', 'Non-taxable Receipt', 'income'),
  ('business-expense', 'Business Expense', 'expense'),
  ('personal-expense', 'Personal Expense', 'expense'),
  ('business-asset', 'Business Asset', 'expense'),
  ('tax-paid', 'Tax Paid', 'expense')
ON CONFLICT (id) DO NOTHING;

-- 2. Add new categories (investment-income, rental-income, equipment)
-- Must run before category_tax_defaults insert (FK constraint)
INSERT INTO public.categories (id, name, icon_identifier, color_hex, transaction_type_hint, is_system, created_at) VALUES
  ('investment-income', 'Investment Income', 'trending-up', '#8E44AD', 'credit', true, now()),
  ('rental-income', 'Rental Income', 'home', '#1ABC9C', 'credit', true, now()),
  ('equipment', 'Equipment', 'devices', '#E91E63', 'debit', true, now())
ON CONFLICT (id) DO NOTHING;

-- 3. category_tax_defaults mapping table
CREATE TABLE IF NOT EXISTS public.category_tax_defaults (
    category_id TEXT PRIMARY KEY REFERENCES public.categories(id),
    default_tax_classification_id TEXT NOT NULL REFERENCES public.tax_classifications(id),
    user_can_override BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.category_tax_defaults (category_id, default_tax_classification_id, user_can_override) VALUES
  -- Income
  ('salary', 'employment-income', false),
  ('business-income', 'business-income', false),
  ('freelance', 'freelance-income', false),
  ('investment-income', 'investment-income', false),
  ('rental-income', 'rental-income', false),
  ('gifts', 'non-taxable-receipt', true),
  ('other-income', 'other-taxable-income', true),
  -- Expense
  ('food-dining', 'personal-expense', true),
  ('transport', 'personal-expense', true),
  ('airtime-data', 'personal-expense', true),
  ('shopping', 'personal-expense', true),
  ('utilities', 'personal-expense', true),
  ('rent', 'personal-expense', true),
  ('business-expense', 'business-expense', true),
  ('equipment', 'business-asset', true),
  ('health', 'personal-expense', true),
  ('education', 'personal-expense', true),
  ('other-expense', 'personal-expense', true)
ON CONFLICT (category_id) DO NOTHING;

-- 4. Add tax_classification_id column to transactions
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS tax_classification_id TEXT REFERENCES public.tax_classifications(id);

-- 5. Remove default_tax_classification from categories if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'default_tax_classification'
  ) THEN
    ALTER TABLE public.categories DROP COLUMN default_tax_classification;
  END IF;
END $$;

-- 6. RLS policies for new tables
ALTER TABLE public.tax_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_tax_defaults ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read tax classifications" ON public.tax_classifications FOR SELECT USING (true);
CREATE POLICY "Everyone can read category tax defaults" ON public.category_tax_defaults FOR SELECT USING (true);



-- ========================================
-- 20260614_enforce_content_hash.sql
-- ========================================

ALTER TABLE public.failed_parses
ADD COLUMN IF NOT EXISTS content_hash TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS transactions_user_content_hash_idx
ON public.transactions (user_id, content_hash)
WHERE content_hash IS NOT NULL;



-- ========================================
-- 20260614_merchant_normalization.sql
-- ========================================

CREATE TABLE IF NOT EXISTS public.merchant_normalization (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alias_pattern TEXT NOT NULL,
    canonical_name TEXT NOT NULL,
    match_type TEXT NOT NULL DEFAULT 'normalized_equals'
        CHECK (match_type IN ('normalized_equals', 'contains', 'regex')),
    priority INTEGER NOT NULL DEFAULT 0,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(alias_pattern, match_type)
);

ALTER TABLE public.merchant_normalization ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read merchant_normalization"
    ON public.merchant_normalization
    FOR SELECT
    USING (true);

CREATE INDEX idx_merchant_normalization_priority
    ON public.merchant_normalization (priority DESC);



-- ========================================
-- 20260614_recurring_patterns.sql
-- ========================================

CREATE TABLE IF NOT EXISTS public.recurring_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    merchant_name TEXT NOT NULL,
    category_id TEXT REFERENCES public.categories(id),
    confidence TEXT NOT NULL CHECK (confidence IN ('high', 'medium', 'low')),
    pattern_type TEXT NOT NULL CHECK (pattern_type IN ('fixed_subscription', 'variable_subscription', 'utility', 'irregular')),
    interval_days INTEGER NOT NULL,
    typical_amount DECIMAL(12,2) NOT NULL,
    amount_tolerance DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    last_transaction_date BIGINT NOT NULL,
    next_expected_date BIGINT,
    transaction_ids TEXT[] NOT NULL DEFAULT '{}',
    occurrences INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_detected_at BIGINT NOT NULL,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    UNIQUE(user_id, merchant_name, pattern_type)
);

ALTER TABLE public.recurring_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own recurring patterns"
    ON public.recurring_patterns
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own recurring patterns"
    ON public.recurring_patterns
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own recurring patterns"
    ON public.recurring_patterns
    FOR UPDATE
    USING (user_id = auth.uid());

CREATE INDEX idx_recurring_patterns_user
    ON public.recurring_patterns (user_id);

CREATE INDEX idx_recurring_patterns_next_expected
    ON public.recurring_patterns (next_expected_date)
    WHERE is_active = true;



-- ========================================
-- 20260617_add_statement_channel_and_missing_columns.sql
-- ========================================

-- Add 'statement' to source_channel constraint and missing columns

ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_source_channel_check,
  ADD CONSTRAINT transactions_source_channel_check
    CHECK (source_channel IN ('sms', 'email', 'manual', 'statement'));

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS wht_amount DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS wht_client_name TEXT,
  ADD COLUMN IF NOT EXISTS receipt_image_uri TEXT,
  ADD COLUMN IF NOT EXISTS confidence_level VARCHAR(10);



-- ========================================
-- 20260618_add_foreign_currency_fields.sql
-- ========================================

-- SpendNG Foreign Currency Support
-- Adds columns for tracking original currency amounts + exchange rates

-- 1. Add foreign currency columns to transactions
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS original_currency TEXT,
  ADD COLUMN IF NOT EXISTS original_amount NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(12,6),
  ADD COLUMN IF NOT EXISTS amount_in_naira NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS rate_source TEXT,
  ADD COLUMN IF NOT EXISTS rate_date BIGINT;

-- 2. exchange_rates cache table
CREATE TABLE IF NOT EXISTS public.exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_currency TEXT NOT NULL,
    to_currency TEXT NOT NULL DEFAULT 'NGN',
    rate NUMERIC(12,6) NOT NULL,
    rate_date DATE NOT NULL,
    source TEXT NOT NULL DEFAULT 'free-api',
    created_at BIGINT NOT NULL,
    UNIQUE (from_currency, to_currency, rate_date)
);

ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read exchange rates" ON public.exchange_rates
    FOR SELECT USING (true);

-- 3. Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_transactions_original_currency ON public.transactions(original_currency);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_lookup ON public.exchange_rates(from_currency, rate_date);



-- ========================================
-- 20260619_add_receipt_path.sql
-- ========================================

-- Add receipt_path column for cloud-stored receipt images

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS receipt_path TEXT;

-- RLS policies for the receipts storage bucket
-- Users can only access their own receipts folder

CREATE POLICY "Users can upload their own receipts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'receipts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own receipts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'receipts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own receipts"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'receipts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);



