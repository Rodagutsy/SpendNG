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
