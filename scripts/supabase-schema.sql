-- SpendNG Supabase Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- Drop existing tables if re-running
DROP TABLE IF EXISTS failed_parses;
DROP TABLE IF EXISTS sync_logs;
DROP TABLE IF EXISTS rules;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS categories;

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  icon_identifier TEXT NOT NULL,
  color_hex TEXT NOT NULL,
  transaction_type_hint TEXT NOT NULL CHECK (transaction_type_hint IN ('credit', 'debit', 'both')),
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Everyone can read system categories
CREATE POLICY "Anyone can read system categories" ON categories
  FOR SELECT USING (user_id IS NULL);

-- Users can read their own custom categories
CREATE POLICY "Users can read own categories" ON categories
  FOR SELECT USING (user_id = auth.uid());

-- Users can create their own categories
CREATE POLICY "Users can insert own categories" ON categories
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own categories
CREATE POLICY "Users can update own categories" ON categories
  FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own categories
CREATE POLICY "Users can delete own categories" ON categories
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- TRANSACTIONS
-- ============================================================
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL DEFAULT auth.uid(),
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('credit', 'debit')),
  merchant_name TEXT,
  category_id TEXT NOT NULL REFERENCES categories(id),
  account_name TEXT,
  account_number_last4 TEXT,
  transaction_date BIGINT NOT NULL,
  available_balance REAL,
  source_channel TEXT NOT NULL CHECK (source_channel IN ('sms', 'email', 'manual')),
  raw_source_text TEXT,
  parse_confidence TEXT,
  is_duplicate BOOLEAN NOT NULL DEFAULT false,
  is_flagged_for_review BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  is_synced BOOLEAN NOT NULL DEFAULT true,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own transactions" ON transactions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own transactions" ON transactions
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own transactions" ON transactions
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- RULES (categorization rules)
-- ============================================================
CREATE TABLE rules (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  keyword TEXT NOT NULL,
  match_type TEXT NOT NULL CHECK (match_type IN ('exact', 'contains', 'starts_with', 'regex')),
  category_id TEXT NOT NULL REFERENCES categories(id),
  priority INTEGER NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT false,
  last_applied_at BIGINT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

ALTER TABLE rules ENABLE ROW LEVEL SECURITY;

-- Everyone can read system rules
CREATE POLICY "Anyone can read system rules" ON rules
  FOR SELECT USING (user_id IS NULL);

-- Users can read their own custom rules
CREATE POLICY "Users can read own rules" ON rules
  FOR SELECT USING (user_id = auth.uid());

-- Users can create their own rules
CREATE POLICY "Users can insert own rules" ON rules
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own rules
CREATE POLICY "Users can update own rules" ON rules
  FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own rules
CREATE POLICY "Users can delete own rules" ON rules
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- FAILED PARSES
-- ============================================================
CREATE TABLE failed_parses (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL DEFAULT auth.uid(),
  source_channel TEXT NOT NULL,
  sender_identifier TEXT NOT NULL,
  failure_reason TEXT NOT NULL,
  raw_source_text TEXT,
  is_reviewed BOOLEAN NOT NULL DEFAULT false,
  reviewed_at BIGINT,
  created_at BIGINT NOT NULL
);

ALTER TABLE failed_parses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own failed parses" ON failed_parses
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own failed parses" ON failed_parses
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================================
-- SEED DATA
-- ============================================================
INSERT INTO categories (id, user_id, name, icon_identifier, color_hex, transaction_type_hint, is_system, created_at, updated_at) VALUES
  ('cat-01', NULL, 'Food & Dining', 'utensils', '#FF6B35', 'debit', true, 0, 0),
  ('cat-02', NULL, 'Transport', 'car', '#4ECDC4', 'debit', true, 0, 0),
  ('cat-03', NULL, 'Utilities & Bills', 'zap', '#FFE66D', 'debit', true, 0, 0),
  ('cat-04', NULL, 'Airtime & Data', 'wifi', '#A8E6CF', 'debit', true, 0, 0),
  ('cat-05', NULL, 'Transfers Sent', 'arrow-up-right', '#C5C3BF', 'debit', true, 0, 0),
  ('cat-06', NULL, 'Transfers Received', 'arrow-down-left', '#99BBFF', 'credit', true, 0, 0),
  ('cat-07', NULL, 'Salary & Wages', 'briefcase', '#0B5CFF', 'credit', true, 0, 0),
  ('cat-08', NULL, 'Business Income', 'briefcase', '#00AACC', 'credit', true, 0, 0),
  ('cat-09', NULL, 'Shopping', 'shopping-bag', '#FF9999', 'debit', true, 0, 0),
  ('cat-10', NULL, 'Entertainment', 'clapperboard', '#CC99FF', 'debit', true, 0, 0),
  ('cat-11', NULL, 'Health', 'stethoscope', '#FF6666', 'debit', true, 0, 0),
  ('cat-12', NULL, 'Education', 'graduation-cap', '#66B2FF', 'debit', true, 0, 0),
  ('cat-13', NULL, 'Rent & Housing', 'home', '#997300', 'debit', true, 0, 0),
  ('cat-14', NULL, 'Uncategorized', 'help-circle', '#ADAAA4', 'both', true, 0, 0);

INSERT INTO rules (id, user_id, keyword, match_type, category_id, priority, is_system, created_at, updated_at) VALUES
  ('rule-01', NULL, 'shoprite', 'contains', 'cat-01', 50, true, 0, 0),
  ('rule-02', NULL, 'kfc', 'contains', 'cat-01', 49, true, 0, 0),
  ('rule-03', NULL, 'chicken republic', 'contains', 'cat-01', 48, true, 0, 0),
  ('rule-04', NULL, 'dominos', 'contains', 'cat-01', 47, true, 0, 0),
  ('rule-05', NULL, 'uber eats', 'contains', 'cat-01', 46, true, 0, 0),
  ('rule-06', NULL, 'uber', 'contains', 'cat-02', 45, true, 0, 0),
  ('rule-07', NULL, 'bolt', 'contains', 'cat-02', 44, true, 0, 0),
  ('rule-08', NULL, 'dstv', 'contains', 'cat-03', 43, true, 0, 0),
  ('rule-09', NULL, 'mtn', 'contains', 'cat-04', 42, true, 0, 0),
  ('rule-10', NULL, 'airtel', 'contains', 'cat-04', 41, true, 0, 0),
  ('rule-11', NULL, 'glo', 'contains', 'cat-04', 40, true, 0, 0),
  ('rule-12', NULL, '9mobile', 'contains', 'cat-04', 39, true, 0, 0),
  ('rule-13', NULL, 'jumia', 'contains', 'cat-09', 38, true, 0, 0),
  ('rule-14', NULL, 'konga', 'contains', 'cat-09', 37, true, 0, 0),
  ('rule-15', NULL, 'netflix', 'contains', 'cat-10', 36, true, 0, 0),
  ('rule-16', NULL, 'showmax', 'contains', 'cat-10', 35, true, 0, 0),
  ('rule-17', NULL, 'pharmacy', 'contains', 'cat-11', 34, true, 0, 0),
  ('rule-18', NULL, 'hospital', 'contains', 'cat-11', 33, true, 0, 0),
  ('rule-19', NULL, 'salary', 'contains', 'cat-07', 32, true, 0, 0),
  ('rule-20', NULL, 'payroll', 'contains', 'cat-07', 31, true, 0, 0),
  ('rule-21', NULL, 'rent', 'contains', 'cat-13', 30, true, 0, 0);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date DESC);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_rules_priority ON rules(priority DESC);
CREATE INDEX idx_categories_system ON categories(is_system);
CREATE INDEX idx_failed_parses_user ON failed_parses(user_id);
