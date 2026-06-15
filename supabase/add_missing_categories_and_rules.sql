-- Add missing categories
INSERT INTO public.categories (id, user_id, name, icon_identifier, color_hex, transaction_type_hint, is_system, created_at, updated_at) VALUES
  ('transfer-sent', NULL, 'Transfer Sent', 'arrow.up.right', '#C5C3BF', 'debit', true, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),
  ('entertainment', NULL, 'Entertainment', 'clapperboard', '#CC99FF', 'debit', true, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint)
ON CONFLICT (id) DO NOTHING;

-- Recreate system rules with Nigerian-focused merchants
INSERT INTO public.rules (id, keyword, match_type, category_id, priority, is_system, user_id, created_at, updated_at) VALUES
  -- Food & Dining
  (gen_random_uuid(), 'chowdeck', 'contains', 'food-dining', 55, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),
  (gen_random_uuid(), 'kfc', 'contains', 'food-dining', 54, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),
  (gen_random_uuid(), 'chicken republic', 'contains', 'food-dining', 53, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),
  (gen_random_uuid(), 'tfc', 'contains', 'food-dining', 52, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),
  (gen_random_uuid(), 'kilimanjaro', 'contains', 'food-dining', 51, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),
  (gen_random_uuid(), 'dominos', 'contains', 'food-dining', 50, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),
  (gen_random_uuid(), 'cold stone', 'contains', 'food-dining', 49, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),
  (gen_random_uuid(), 'shoprite', 'contains', 'food-dining', 48, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),
  (gen_random_uuid(), 'mr bigg', 'contains', 'food-dining', 47, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),
  (gen_random_uuid(), 'glovo', 'contains', 'food-dining', 46, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),
  (gen_random_uuid(), 'jumia food', 'contains', 'food-dining', 45, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),
  (gen_random_uuid(), 'food concepts', 'contains', 'food-dining', 44, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),
  (gen_random_uuid(), 'sweet sensation', 'contains', 'food-dining', 43, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),
  (gen_random_uuid(), 'chicken capital', 'contains', 'food-dining', 42, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),
  (gen_random_uuid(), 'eat n go', 'contains', 'food-dining', 41, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),

  -- Transport
  (gen_random_uuid(), 'uber', 'contains', 'transport', 40, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),
  (gen_random_uuid(), 'bolt', 'contains', 'transport', 39, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),
  (gen_random_uuid(), 'lagride', 'contains', 'transport', 38, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),
  (gen_random_uuid(), 'gokada', 'contains', 'transport', 37, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),
  (gen_random_uuid(), 'max', 'contains', 'transport', 36, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),
  (gen_random_uuid(), 'treepz', 'contains', 'transport', 35, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),

  -- Airtime & Data
  (gen_random_uuid(), 'mtn', 'contains', 'airtime-data', 34, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),
  (gen_random_uuid(), 'airtel', 'contains', 'airtime-data', 33, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),
  (gen_random_uuid(), 'glo', 'contains', 'airtime-data', 32, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),
  (gen_random_uuid(), '9mobile', 'contains', 'airtime-data', 31, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),
  (gen_random_uuid(), 'etisalat', 'contains', 'airtime-data', 30, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),
  (gen_random_uuid(), 'starlink', 'contains', 'airtime-data', 29, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),
  (gen_random_uuid(), 'spectranet', 'contains', 'airtime-data', 28, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),

  -- Utilities
  (gen_random_uuid(), 'dstv', 'contains', 'utilities', 27, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),
  (gen_random_uuid(), 'gotv', 'contains', 'utilities', 26, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),
  (gen_random_uuid(), 'startimes', 'contains', 'utilities', 25, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),
  (gen_random_uuid(), 'ikedc', 'contains', 'utilities', 24, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),
  (gen_random_uuid(), 'eko electric', 'contains', 'utilities', 23, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),
  (gen_random_uuid(), 'aedc', 'contains', 'utilities', 22, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),
  (gen_random_uuid(), 'phedc', 'contains', 'utilities', 21, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),
  (gen_random_uuid(), 'ibedc', 'contains', 'utilities', 20, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),
  (gen_random_uuid(), 'bedc', 'contains', 'utilities', 19, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),
  (gen_random_uuid(), 'kedc', 'contains', 'utilities', 18, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),

  -- Shopping
  (gen_random_uuid(), 'jumia', 'contains', 'shopping', 17, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),
  (gen_random_uuid(), 'konga', 'contains', 'shopping', 16, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),
  (gen_random_uuid(), 'shein', 'contains', 'shopping', 15, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),
  (gen_random_uuid(), 'temu', 'contains', 'shopping', 14, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),
  (gen_random_uuid(), 'aliexpress', 'contains', 'shopping', 13, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),

  -- Health
  (gen_random_uuid(), 'pharmacy', 'contains', 'health', 12, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),
  (gen_random_uuid(), 'hospital', 'contains', 'health', 11, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),
  (gen_random_uuid(), 'medplus', 'contains', 'health', 10, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),
  (gen_random_uuid(), 'healthplus', 'contains', 'health', 9, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),

  -- Entertainment
  (gen_random_uuid(), 'netflix', 'contains', 'entertainment', 8, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),
  (gen_random_uuid(), 'showmax', 'contains', 'entertainment', 7, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),
  (gen_random_uuid(), 'spotify', 'contains', 'entertainment', 6, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),
  (gen_random_uuid(), 'apple music', 'contains', 'entertainment', 5, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),
  (gen_random_uuid(), 'youtube premium', 'contains', 'entertainment', 4, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),
  (gen_random_uuid(), 'prime video', 'contains', 'entertainment', 3, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),

  -- Income / Salary
  (gen_random_uuid(), 'salary', 'contains', 'salary', 2, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint),
  (gen_random_uuid(), 'payroll', 'contains', 'salary', 1, true, NULL, EXTRACT(EPOCH FROM now())::bigint, EXTRACT(EPOCH FROM now())::bigint);
