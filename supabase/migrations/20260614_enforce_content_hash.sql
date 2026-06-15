ALTER TABLE public.failed_parses
ADD COLUMN IF NOT EXISTS content_hash TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS transactions_user_content_hash_idx
ON public.transactions (user_id, content_hash)
WHERE content_hash IS NOT NULL;
