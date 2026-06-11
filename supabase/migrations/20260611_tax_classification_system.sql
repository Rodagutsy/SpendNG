-- SpendNG Tax Classification System
-- Run this in your Supabase SQL editor.

-- 1. tax_classifications lookup table
CREATE TABLE IF NOT EXISTS public.tax_classifications (
    id TEXT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    direction VARCHAR(10) CHECK (direction IN ('income', 'expense')) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.tax_classifications (id, name, direction) VALUES
  ('employment-income', 'Employment Income', 'income'),
  ('business-income', 'Business Income', 'income'),
  ('freelance-income', 'Freelance Income', 'income'),
  ('investment-income', 'Investment Income', 'income'),
  ('rental-income', 'Rental Income', 'income'),
  ('other-taxable-income', 'Other Taxable Income', 'income'),
  ('non-taxable-receipt', 'Non-taxable Receipt', 'income'),
  ('business-expense', 'Business Expense', 'expense'),
  ('personal-expense', 'Personal Expense', 'expense'),
  ('business-asset', 'Business Asset', 'expense'),
  ('tax-paid', 'Tax Paid', 'expense')
ON CONFLICT (id) DO NOTHING;

-- 2. Add new categories (investment-income, rental-income, equipment)
-- Must run before category_tax_defaults insert (FK constraint)
INSERT INTO public.categories (id, name, icon_identifier, color_hex, transaction_type_hint, is_system, created_at, updated_at) VALUES
  ('investment-income', 'Investment Income', 'trending-up', '#8E44AD', 'credit', true, 0, 0),
  ('rental-income', 'Rental Income', 'home', '#1ABC9C', 'credit', true, 0, 0),
  ('equipment', 'Equipment', 'devices', '#E91E63', 'debit', true, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- 3. category_tax_defaults mapping table
CREATE TABLE IF NOT EXISTS public.category_tax_defaults (
    category_id TEXT PRIMARY KEY REFERENCES public.categories(id),
    default_tax_classification_id TEXT NOT NULL REFERENCES public.tax_classifications(id),
    user_can_override BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.category_tax_defaults (category_id, default_tax_classification_id, user_can_override) VALUES
  -- Income
  ('salary', 'employment-income', false),
  ('business-income', 'business-income', false),
  ('freelance', 'freelance-income', false),
  ('investment-income', 'investment-income', false),
  ('rental-income', 'rental-income', false),
  ('gifts', 'non-taxable-receipt', true),
  ('other-income', 'other-taxable-income', true),
  -- Expense
  ('food-dining', 'personal-expense', true),
  ('transport', 'personal-expense', true),
  ('airtime-data', 'personal-expense', true),
  ('shopping', 'personal-expense', true),
  ('utilities', 'personal-expense', true),
  ('rent', 'personal-expense', true),
  ('business-expense', 'business-expense', true),
  ('equipment', 'business-asset', true),
  ('health', 'personal-expense', true),
  ('education', 'personal-expense', true),
  ('other-expense', 'personal-expense', true)
ON CONFLICT (category_id) DO NOTHING;

-- 4. Add tax_classification_id column to transactions
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS tax_classification_id TEXT REFERENCES public.tax_classifications(id);

-- 5. Remove default_tax_classification from categories if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'default_tax_classification'
  ) THEN
    ALTER TABLE public.categories DROP COLUMN default_tax_classification;
  END IF;
END $$;

-- 6. RLS policies for new tables
ALTER TABLE public.tax_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_tax_defaults ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read tax classifications" ON public.tax_classifications FOR SELECT USING (true);
CREATE POLICY "Everyone can read category tax defaults" ON public.category_tax_defaults FOR SELECT USING (true);
