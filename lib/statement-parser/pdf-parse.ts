import { extractText } from 'expo-pdf-text-extract';
import * as DocumentPicker from 'expo-document-picker';
import type { ParsedStatementRow } from './csv-generic';

export async function importPdfStatement(fileUri?: string): Promise<ParsedStatementRow[] | null> {
  let uri = fileUri;
  if (!uri) {
    const file = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (file.canceled) return null;
    uri = file.assets[0].uri;
  }

  const text = await extractText(uri);
  return parseBankStatementText(text);
}

function parseBankStatementText(text: string): ParsedStatementRow[] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const transactions: ParsedStatementRow[] = [];

  for (const line of lines) {
    const match = line.match(
      /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([-]?[\d,]+\.\d{2})\s+([\d,]+\.\d{2})/,
    );
    if (match) {
      const rawAmount = parseFloat(match[3].replace(/,/g, ''));
      transactions.push({
        date: match[1],
        description: match[2].trim(),
        amount: Math.abs(rawAmount),
        type: rawAmount < 0 ? 'debit' : 'credit',
        balance: parseFloat(match[4].replace(/,/g, '')),
      });
    }
  }

  return transactions;
}
