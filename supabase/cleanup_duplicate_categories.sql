-- 1. Remap transactions using old category IDs to new ones
UPDATE public.transactions SET category_id = 'food-dining' WHERE category_id = 'cat-01';
UPDATE public.transactions SET category_id = 'transport' WHERE category_id = 'cat-02';
UPDATE public.transactions SET category_id = 'utilities' WHERE category_id = 'cat-03';
UPDATE public.transactions SET category_id = 'airtime-data' WHERE category_id = 'cat-04';
UPDATE public.transactions SET category_id = 'other-expense' WHERE category_id = 'cat-05';
UPDATE public.transactions SET category_id = 'other-income' WHERE category_id = 'cat-06';
UPDATE public.transactions SET category_id = 'salary' WHERE category_id = 'cat-07';
UPDATE public.transactions SET category_id = 'business-income' WHERE category_id = 'cat-08';
UPDATE public.transactions SET category_id = 'shopping' WHERE category_id = 'cat-09';
UPDATE public.transactions SET category_id = 'other-expense' WHERE category_id = 'cat-10';
UPDATE public.transactions SET category_id = 'health' WHERE category_id = 'cat-11';
UPDATE public.transactions SET category_id = 'education' WHERE category_id = 'cat-12';
UPDATE public.transactions SET category_id = 'rent' WHERE category_id = 'cat-13';
UPDATE public.transactions SET category_id = CASE WHEN transaction_type = 'credit' THEN 'other-income' ELSE 'other-expense' END WHERE category_id = 'cat-14';

-- 2. Delete old duplicate categories
DELETE FROM public.categories WHERE id LIKE 'cat-%';
