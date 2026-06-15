-- NOTE: This migration is superseded by 20260507_init.sql (v2).
-- RLS policies and WITH CHECK clauses are now defined directly in init.sql.
-- Keep this file only for existing databases that ran the original init.sql.
-- New deployments can skip this migration.

-- Add INSERT policy for transactions to fix RLS violation
CREATE POLICY IF NOT EXISTS "Users can insert their own transactions" ON public.transactions
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Also add WITH CHECK for UPDATE on the existing policy
DROP POLICY IF EXISTS "Users can only access their own transactions" ON public.transactions;
CREATE POLICY "Users can only access their own transactions" ON public.transactions
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
