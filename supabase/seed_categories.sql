-- Seed default categories for SpendNG
INSERT INTO public.categories (id, name, icon_identifier, color_hex, transaction_type_hint, is_system, created_at) VALUES
  -- Expense categories
  ('food-dining', 'Food & Dining', 'utensils', '#FF6B6B', 'debit', true, now()),
  ('transport', 'Transport', 'car', '#4ECDC4', 'debit', true, now()),
  ('airtime-data', 'Airtime & Data', 'wifi', '#45B7D1', 'debit', true, now()),
  ('shopping', 'Shopping', 'shopping-bag', '#96CEB4', 'debit', true, now()),
  ('utilities', 'Utilities', 'bolt', '#FFEAA7', 'debit', true, now()),
  ('rent', 'Rent', 'home', '#DDA0DD', 'debit', true, now()),
  ('business-expense', 'Business Expense', 'briefcase', '#98D8C8', 'debit', true, now()),
  ('health', 'Health', 'stethoscope', '#F7DC6F', 'debit', true, now()),
  ('education', 'Education', 'graduation-cap', '#BB8FCE', 'debit', true, now()),
  ('transfer-sent', 'Transfer Sent', 'arrow.up.right', '#C5C3BF', 'debit', true, now()),
  ('entertainment', 'Entertainment', 'clapperboard', '#CC99FF', 'debit', true, now()),
  ('other-expense', 'Other Expense', 'tag.fill', '#ADAAA4', 'debit', true, now()),
  -- Income categories
  ('salary', 'Salary', 'wallet', '#2ECC71', 'credit', true, now()),
  ('business-income', 'Business Income', 'briefcase', '#3498DB', 'credit', true, now()),
  ('freelance', 'Freelance', 'laptop', '#E67E22', 'credit', true, now()),
  ('gifts', 'Gifts', 'card-giftcard', '#E74C3C', 'credit', true, now()),
  ('other-income', 'Other Income', 'tag.fill', '#95A5A6', 'credit', true, now())
ON CONFLICT (id) DO NOTHING;
