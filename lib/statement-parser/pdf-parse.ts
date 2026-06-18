import { File } from 'expo-file-system/next';
import { supabase } from '../supabase';
import type { ParsedStatementRow } from './csv-generic';

export async function parsePDFWithEdgeFunction(fileUri: string): Promise<{
  rows: ParsedStatementRow[];
  pageCount?: number;
}> {
  const file = new File(fileUri);
  const bytes = await file.bytes();
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  const { data, error } = await supabase.functions.invoke('parse-pdf', {
    body: { fileBase64: base64 },
  });

  if (error) throw new Error(error.message || 'Edge function error');
  if (!data?.rows) throw new Error('No rows returned from PDF parser');

  return { rows: data.rows, pageCount: data.pageCount };
}
