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
