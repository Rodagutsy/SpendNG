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
