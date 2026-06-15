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
