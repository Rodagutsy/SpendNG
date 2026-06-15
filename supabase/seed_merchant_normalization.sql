-- Banks
INSERT INTO merchant_normalization (alias_pattern, canonical_name, match_type, priority, is_system) VALUES
  ('access bank', 'Access Bank', 'contains', 10, true),
  ('access bank plc', 'Access Bank', 'contains', 10, true),
  ('diamond bank', 'Access Bank', 'contains', 10, true),

  ('first bank', 'First Bank', 'contains', 10, true),
  ('firstbank', 'First Bank', 'contains', 10, true),
  ('first bank nigeria', 'First Bank', 'contains', 10, true),

  ('gtbank', 'GTBank', 'normalized_equals', 10, true),
  ('gt bank', 'GTBank', 'normalized_equals', 10, true),
  ('gtco', 'GTBank', 'normalized_equals', 10, true),
  ('guaranty trust bank', 'GTBank', 'contains', 10, true),

  ('uba', 'UBA', 'normalized_equals', 10, true),
  ('u.b.a', 'UBA', 'normalized_equals', 10, true),
  ('uba bank', 'UBA', 'contains', 10, true),
  ('united bank for africa', 'UBA', 'contains', 10, true),

  ('zenith bank', 'Zenith Bank', 'contains', 10, true),
  ('zenith', 'Zenith Bank', 'contains', 9, true),

  ('fidelity bank', 'Fidelity Bank', 'contains', 10, true),

  ('fcmb', 'FCMB', 'normalized_equals', 10, true),
  ('fcmb bank', 'FCMB', 'contains', 10, true),
  ('first city monument bank', 'FCMB', 'contains', 10, true),

  ('stanbic', 'Stanbic IBTC', 'contains', 10, true),
  ('stanbic ibtc', 'Stanbic IBTC', 'contains', 10, true),

  ('union bank', 'Union Bank', 'contains', 10, true),

  ('sterling bank', 'Sterling Bank', 'contains', 10, true),

  ('wema bank', 'Wema Bank', 'contains', 10, true),
  ('alat', 'Wema Bank', 'normalized_equals', 10, true),
  ('alat by wema', 'Wema Bank', 'contains', 10, true),

  ('polaris bank', 'Polaris Bank', 'contains', 10, true),
  ('skye bank', 'Polaris Bank', 'contains', 10, true),

  ('ecobank', 'Ecobank', 'normalized_equals', 10, true),
  ('eco bank', 'Ecobank', 'normalized_equals', 10, true),

  ('heritage bank', 'Heritage Bank', 'contains', 10, true),

  ('keystone bank', 'Keystone Bank', 'contains', 10, true),

  ('jaiz bank', 'Jaiz Bank', 'contains', 10, true),

  ('moniepoint', 'Moniepoint', 'normalized_equals', 10, true),
  ('monie point', 'Moniepoint', 'normalized_equals', 10, true),
  ('moniepoint mfb', 'Moniepoint', 'contains', 10, true),

  ('opay', 'OPay', 'normalized_equals', 10, true),
  ('opay mfb', 'OPay', 'contains', 10, true),
  ('opay digital', 'OPay', 'contains', 10, true),

  ('palmpay', 'PalmPay', 'normalized_equals', 10, true),
  ('palm pay', 'PalmPay', 'normalized_equals', 10, true),

  ('kuda', 'Kuda', 'normalized_equals', 10, true),
  ('kuda bank', 'Kuda', 'contains', 10, true),
  ('kuda microfinance', 'Kuda', 'contains', 10, true),

  ('fairmoney', 'FairMoney', 'normalized_equals', 10, true),
  ('fair money', 'FairMoney', 'normalized_equals', 10, true),

  ('carbon', 'Carbon', 'normalized_equals', 10, true),
  ('carbon mfb', 'Carbon', 'contains', 10, true),

  ('vbank', 'VBank', 'normalized_equals', 10, true),
  ('v mfb', 'VBank', 'normalized_equals', 10, true),

  ('sparkle', 'Sparkle', 'normalized_equals', 10, true),
  ('sparkle mfb', 'Sparkle', 'contains', 10, true),

  ('rubies bank', 'Rubies MFB', 'contains', 10, true),
  ('rubies mfb', 'Rubies MFB', 'contains', 10, true)
ON CONFLICT (alias_pattern, match_type) DO NOTHING;

-- Ride-hailing
INSERT INTO merchant_normalization (alias_pattern, canonical_name, match_type, priority, is_system) VALUES
  ('uber', 'Uber', 'normalized_equals', 10, true),
  ('uber bv', 'Uber', 'contains', 9, true),
  ('uber trip', 'Uber', 'contains', 9, true),

  ('bolt', 'Bolt', 'normalized_equals', 10, true),
  ('taxify', 'Bolt', 'normalized_equals', 10, true)
ON CONFLICT (alias_pattern, match_type) DO NOTHING;

-- Food delivery
INSERT INTO merchant_normalization (alias_pattern, canonical_name, match_type, priority, is_system) VALUES
  ('chowdeck', 'Chowdeck', 'normalized_equals', 10, true),
  ('chow deck', 'Chowdeck', 'normalized_equals', 10, true),

  ('jumia', 'Jumia', 'normalized_equals', 10, true),
  ('jumia food', 'Jumia Food', 'contains', 10, true),

  ('domin', 'Domino''s Pizza', 'contains', 10, true),
  ('domino', 'Domino''s Pizza', 'normalized_equals', 10, true),

  ('kfc', 'KFC', 'normalized_equals', 10, true),
  ('kentucky fried chicken', 'KFC', 'contains', 10, true)
ON CONFLICT (alias_pattern, match_type) DO NOTHING;

-- Telcos
INSERT INTO merchant_normalization (alias_pattern, canonical_name, match_type, priority, is_system) VALUES
  ('mtn', 'MTN', 'normalized_equals', 10, true),
  ('mtn nigeria', 'MTN', 'contains', 10, true),
  ('mtn airtime', 'MTN', 'contains', 10, true),

  ('glo', 'Glo', 'normalized_equals', 10, true),
  ('globacom', 'Glo', 'normalized_equals', 10, true),

  ('airtel', 'Airtel', 'normalized_equals', 10, true),
  ('airtel nigeria', 'Airtel', 'contains', 10, true),
  ('zain', 'Airtel', 'normalized_equals', 10, true),

  ('9mobile', '9mobile', 'normalized_equals', 10, true),
  ('9 mobile', '9mobile', 'normalized_equals', 10, true),
  ('etisalat', '9mobile', 'normalized_equals', 10, true)
ON CONFLICT (alias_pattern, match_type) DO NOTHING;

-- Subscriptions
INSERT INTO merchant_normalization (alias_pattern, canonical_name, match_type, priority, is_system) VALUES
  ('netflix', 'Netflix', 'normalized_equals', 10, true),
  ('netflix com', 'Netflix', 'contains', 10, true),

  ('spotify', 'Spotify', 'normalized_equals', 10, true),
  ('spotify premium', 'Spotify', 'contains', 10, true),
  ('spotify technology', 'Spotify', 'contains', 9, true),

  ('apple', 'Apple', 'normalized_equals', 10, true),
  ('apple com', 'Apple', 'contains', 10, true),
  ('apple services', 'Apple', 'contains', 10, true),
  ('apple inc', 'Apple', 'contains', 10, true),
  ('itunes', 'Apple', 'normalized_equals', 10, true),

  ('amazon', 'Amazon', 'normalized_equals', 10, true),
  ('amazon prime', 'Amazon', 'contains', 10, true),
  ('amazon web services', 'Amazon', 'contains', 10, true),
  ('aws', 'Amazon', 'normalized_equals', 10, true),

  ('google', 'Google', 'normalized_equals', 10, true),
  ('google play', 'Google', 'contains', 10, true),
  ('google services', 'Google', 'contains', 10, true),
  ('google inc', 'Google', 'contains', 10, true),
  ('youtube premium', 'Google', 'contains', 10, true),

  ('microsoft', 'Microsoft', 'normalized_equals', 10, true),
  ('microsoft 365', 'Microsoft', 'contains', 10, true),
  ('microsoft corp', 'Microsoft', 'contains', 10, true)
ON CONFLICT (alias_pattern, match_type) DO NOTHING;
