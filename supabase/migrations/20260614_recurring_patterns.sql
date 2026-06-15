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
