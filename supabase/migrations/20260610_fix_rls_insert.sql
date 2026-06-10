-- Add INSERT policy for transactions to fix RLS violation
CREATE POLICY "Users can insert their own transactions" ON public.transactions
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Also add WITH CHECK for UPDATE on the existing policy
DROP POLICY IF EXISTS "Users can only access their own transactions" ON public.transactions;
CREATE POLICY "Users can only access their own transactions" ON public.transactions
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
