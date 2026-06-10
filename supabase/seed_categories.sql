-- Seed default categories for SpendNG
INSERT INTO public.categories (id, name, icon_identifier, color_hex, transaction_type_hint, is_system, created_at, updated_at) VALUES
  -- Expense categories
  ('food-dining', 'Food & Dining', 'utensils', '#FF6B6B', 'debit', true, 0, 0),
  ('transport', 'Transport', 'car', '#4ECDC4', 'debit', true, 0, 0),
  ('airtime-data', 'Airtime & Data', 'wifi', '#45B7D1', 'debit', true, 0, 0),
  ('shopping', 'Shopping', 'shopping-bag', '#96CEB4', 'debit', true, 0, 0),
  ('utilities', 'Utilities', 'bolt', '#FFEAA7', 'debit', true, 0, 0),
  ('rent', 'Rent', 'home', '#DDA0DD', 'debit', true, 0, 0),
  ('business-expense', 'Business Expense', 'briefcase', '#98D8C8', 'debit', true, 0, 0),
  ('health', 'Health', 'stethoscope', '#F7DC6F', 'debit', true, 0, 0),
  ('education', 'Education', 'graduation-cap', '#BB8FCE', 'debit', true, 0, 0),
  ('other-expense', 'Other Expense', 'tag.fill', '#ADAAA4', 'debit', true, 0, 0),
  -- Income categories
  ('salary', 'Salary', 'wallet', '#2ECC71', 'credit', true, 0, 0),
  ('business-income', 'Business Income', 'briefcase', '#3498DB', 'credit', true, 0, 0),
  ('freelance', 'Freelance', 'laptop', '#E67E22', 'credit', true, 0, 0),
  ('gifts', 'Gifts', 'card-giftcard', '#E74C3C', 'credit', true, 0, 0),
  ('other-income', 'Other Income', 'tag.fill', '#95A5A6', 'credit', true, 0, 0)
ON CONFLICT (id) DO NOTHING;
