-- Security Hardening: Enforce FORCE ROW LEVEL SECURITY on all user-owned tables
ALTER TABLE IF EXISTS profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categories FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transactions FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS category_tax_defaults FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tax_profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS capital_assets FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS wht_credits FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS exchange_rates FORCE ROW LEVEL SECURITY;

-- Allow authenticated users to cache fetched exchange rates safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'exchange_rates' AND policyname = 'Authenticated users can insert exchange rates'
  ) THEN
    CREATE POLICY "Authenticated users can insert exchange rates"
      ON exchange_rates
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;
