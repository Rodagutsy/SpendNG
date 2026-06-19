import { supabase } from './supabase';
import { useAuthStore } from './stores/authStore';
import { File } from 'expo-file-system/next';

export interface ReceiptUploadResult {
  filePath: string;
}

export async function uploadReceipt(uri: string): Promise<ReceiptUploadResult> {
  const userId = useAuthStore.getState().userId;
  if (!userId) throw new Error('Not authenticated');

  const ext = 'jpg';
  const fileName = `${userId}/${Date.now()}.${ext}`;

  const file = new File(uri);
  const bytes = await file.bytes();

  const { data, error } = await supabase.storage
    .from('receipts')
    .upload(fileName, bytes.buffer, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (error) throw new Error(error.message || 'Failed to upload receipt');
  if (!data) throw new Error('No data returned from upload');

  return { filePath: data.path };
}

export async function getReceiptUrl(filePath: string): Promise<string | null> {
  const { data } = await supabase.storage
    .from('receipts')
    .createSignedUrl(filePath, 3600);

  return data?.signedUrl ?? null;
}
