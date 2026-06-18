-- Database Schema Setup for SpendNG

-- 1. Create Rules Table (Categorization rules)
CREATE TABLE IF NOT EXISTS public.rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword TEXT NOT NULL,
    match_type TEXT NOT NULL CHECK (match_type IN ('contains', 'starts_with', 'exact', 'regex')),
    category_id TEXT NOT NULL,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Merchant Normalization Table
CREATE TABLE IF NOT EXISTS public.merchant_normalization (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alias_pattern TEXT NOT NULL,
    canonical_name TEXT NOT NULL,
    match_type TEXT NOT NULL CHECK (match_type IN ('normalized_equals', 'contains', 'regex')),
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC(15, 2) NOT NULL,
    currency TEXT DEFAULT 'NGN' NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('credit', 'debit')),
    merchant_name TEXT,
    category_id TEXT NOT NULL,
    account_name TEXT,
    account_number_last4 TEXT,
    transaction_date BIGINT NOT NULL, -- Epoch milliseconds as used in codebase
    available_balance NUMERIC(15, 2),
    source_channel TEXT NOT NULL CHECK (source_channel IN ('sms', 'email', 'manual')),
    raw_source_text TEXT,
    content_hash TEXT UNIQUE,
    parse_confidence TEXT,
    is_duplicate BOOLEAN DEFAULT FALSE NOT NULL,
    is_flagged_for_review BOOLEAN DEFAULT FALSE NOT NULL,
    notes TEXT,
    is_synced BOOLEAN DEFAULT TRUE NOT NULL,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
);

-- 4. Create Failed Parses Table
CREATE TABLE IF NOT EXISTS public.failed_parses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    source_channel TEXT NOT NULL,
    sender_identifier TEXT,
    failure_reason TEXT,
    raw_source_text TEXT,
    content_hash TEXT,
    is_reviewed BOOLEAN DEFAULT FALSE NOT NULL,
    created_at BIGINT NOT NULL
);

-- Enable RLS (Row Level Security) on user-facing tables
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.failed_parses ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
CREATE POLICY "Users can manage their own transactions" ON public.transactions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own failed parses" ON public.failed_parses
    FOR ALL USING (auth.uid() = user_id);

-- Read-only policy for public rules/normalization (or restrict as needed)
ALTER TABLE public.rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view categorization rules" ON public.rules
    FOR SELECT USING (true);

ALTER TABLE public.merchant_normalization ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view merchant normalizations" ON public.merchant_normalization
    FOR SELECT USING (true);
