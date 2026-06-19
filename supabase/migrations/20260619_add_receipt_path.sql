-- Add receipt_path column for cloud-stored receipt images

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS receipt_path TEXT;

-- RLS policies for the receipts storage bucket
-- Users can only access their own receipts folder

CREATE POLICY "Users can upload their own receipts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'receipts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own receipts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'receipts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own receipts"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'receipts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
