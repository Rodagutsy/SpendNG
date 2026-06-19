import Papa from 'papaparse';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { BankFormat, detectBankFormat } from './bank-formats';

export interface ParsedStatementRow {
  date: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  balance: number | null;
  currency?: string;
}

export interface ColumnMapping {
  dateIndex: number;
  descriptionIndex: number;
  inflowIndex: number;
  outflowIndex: number;
  balanceIndex: number | null;
}

export async function importCsvStatement(fileUri?: string): Promise<{
  rows: ParsedStatementRow[];
  detectedBank: string | null;
} | null> {
  let uri = fileUri;
  if (!uri) {
    const file = await DocumentPicker.getDocumentAsync({
      type: 'text/csv',
      copyToCacheDirectory: true,
    });
    if (file.canceled) return null;
    uri = file.assets[0].uri;
  }

  const raw = await FileSystem.readAsStringAsync(uri);

  const result = Papa.parse<Record<string, any>>(raw, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  if (!result.data || result.data.length === 0) return { rows: [], detectedBank: null };

  const headers = Object.keys(result.data[0]);
  const format = detectBankFormat(headers, []);
  const mapping = autoDetectColumnMapping(headers, format);
  const rows: ParsedStatementRow[] = [];

  for (const row of result.data) {
    const dateVal = row[headers[mapping.dateIndex]];
    if (!dateVal) continue;

    const date = String(dateVal);
    const description = mapping.descriptionIndex >= 0
      ? String(row[headers[mapping.descriptionIndex]] || '')
      : '';

    let amount = 0;
    let type: 'credit' | 'debit' = 'debit';
    let currency: string | undefined;

    if (mapping.inflowIndex >= 0) {
      const inflow = parseFloat(row[headers[mapping.inflowIndex]]);
      if (!isNaN(inflow) && inflow > 0) {
        amount = inflow;
        type = 'credit';
      }
    }

    if (amount === 0 && mapping.outflowIndex >= 0) {
      const outflow = parseFloat(row[headers[mapping.outflowIndex]]);
      if (!isNaN(outflow) && outflow > 0) {
        amount = outflow;
        type = 'debit';
      }
    }

    if (amount === 0) continue;

    let balance: number | null = null;
    if (mapping.balanceIndex !== null) {
      const bal = parseFloat(row[headers[mapping.balanceIndex]]);
      if (!isNaN(bal)) balance = bal;
    }

    rows.push({ date, amount, type, description, balance, currency });
  }

  return { rows, detectedBank: format?.name ?? null };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current.trim());
  return result;
}

function parseDate(value: string): string {
  const cleaned = value.trim().replace(/["']/g, '');
  const patterns = [
    { regex: /^(\d{2})\/(\d{2})\/(\d{4})$/, groups: [1, 2, 3] },
    { regex: /^(\d{4})-(\d{2})-(\d{2})$/, groups: [1, 2, 3] },
    { regex: /^(\d{2})-(\d{2})-(\d{4})$/, groups: [1, 2, 3] },
  ];

  for (const { regex, groups } of patterns) {
    const m = cleaned.match(regex);
    if (m) return `${m[groups[2]]}-${m[groups[1]].padStart(2, '0')}-${m[groups[0]].padStart(2, '0')}`;
  }

  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return cleaned;
}

function detectAmountCurrency(value: string): { amount: number; currency: string } {
  const trimmed = value.trim();
  let currency = 'NGN';
  if (/^[$]/.test(trimmed) || /\bUSD\b/i.test(trimmed)) currency = 'USD';
  else if (/^[£]/.test(trimmed) || /\bGBP\b/i.test(trimmed)) currency = 'GBP';
  else if (/^[€]/.test(trimmed) || /\bEUR\b/i.test(trimmed)) currency = 'EUR';
  const cleaned = trimmed.replace(/["'$£€₦,]/g, '').replace(/\s+/g, '');
  const amount = parseFloat(cleaned);
  return { amount: isNaN(amount) ? 0 : amount, currency };
}

function emptyMapping(): ColumnMapping {
  return { dateIndex: -1, descriptionIndex: -1, inflowIndex: -1, outflowIndex: -1, balanceIndex: null };
}

export function autoDetectColumnMapping(headers: string[], format: BankFormat | null): ColumnMapping {
  const mapping = emptyMapping();

  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());

  for (let i = 0; i < lowerHeaders.length; i++) {
    const h = lowerHeaders[i];

    if (mapping.dateIndex === -1 && /date|value\s*date|posting\s*date|trans\s*date|tran\s*date/i.test(h)) {
      mapping.dateIndex = i;
      continue;
    }

    if (format) {
      if (mapping.inflowIndex === -1 && format.amountInflowHeaders.some((kw) => h.includes(kw))) {
        mapping.inflowIndex = i;
        continue;
      }
      if (mapping.outflowIndex === -1 && format.amountOutflowHeaders.some((kw) => h.includes(kw))) {
        mapping.outflowIndex = i;
        continue;
      }
      if (mapping.descriptionIndex === -1 && format.descriptionHeaders.some((kw) => h.includes(kw))) {
        mapping.descriptionIndex = i;
        continue;
      }
      if (mapping.balanceIndex === null && format.balanceHeaders.some((kw) => h.includes(kw))) {
        mapping.balanceIndex = i;
        continue;
      }
    }

    if (mapping.inflowIndex === -1 && /credit|inflow|deposit|cr\b/i.test(h)) {
      mapping.inflowIndex = i;
      continue;
    }
    if (mapping.outflowIndex === -1 && /debit|outflow|withdrawal|dr\b|payment/i.test(h)) {
      mapping.outflowIndex = i;
      continue;
    }
    if (mapping.descriptionIndex === -1 && /desc|narrat|details|remark|particulars|transaction/i.test(h)) {
      mapping.descriptionIndex = i;
      continue;
    }
    if (mapping.balanceIndex === null && /bal/i.test(h)) {
      mapping.balanceIndex = i;
    }
  }

  return mapping;
}

export function parseCSV(
  content: string,
  columnMapping?: ColumnMapping,
  format?: BankFormat | null,
): ParsedStatementRow[] {
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];

  const rows: ParsedStatementRow[] = [];
  let mapping: ColumnMapping;

  if (columnMapping) {
    mapping = columnMapping;
  } else {
    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine);
    const detected = format ?? detectBankFormat(headers, []);
    mapping = autoDetectColumnMapping(headers, detected);
  }

  if (mapping.dateIndex === -1 || (mapping.inflowIndex === -1 && mapping.outflowIndex === -1)) {
    return [];
  }

  const startLine = columnMapping ? 0 : 1;

  for (let i = startLine; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length <= Math.max(mapping.dateIndex, mapping.inflowIndex, mapping.outflowIndex)) continue;

    const date = parseDate(cols[mapping.dateIndex] ?? '');
    if (!date) continue;

    const description = mapping.descriptionIndex >= 0 && mapping.descriptionIndex < cols.length
      ? cols[mapping.descriptionIndex].trim()
      : '';

    let amount = 0;
    let type: 'credit' | 'debit' = 'debit';
    let currency: string | undefined;

    if (mapping.inflowIndex >= 0 && mapping.inflowIndex < cols.length) {
      const { amount: inflowAmt, currency: cur } = detectAmountCurrency(cols[mapping.inflowIndex]);
      if (inflowAmt > 0) {
        amount = inflowAmt;
        type = 'credit';
        if (cur !== 'NGN') currency = cur;
      }
    }

    if (amount === 0 && mapping.outflowIndex >= 0 && mapping.outflowIndex < cols.length) {
      const { amount: outflowAmt, currency: cur } = detectAmountCurrency(cols[mapping.outflowIndex]);
      if (outflowAmt > 0) {
        amount = outflowAmt;
        type = 'debit';
        if (cur !== 'NGN') currency = cur;
      }
    }

    if (amount === 0) continue;

    let balance: number | null = null;
    if (mapping.balanceIndex !== null && mapping.balanceIndex < cols.length) {
      const { amount: bal } = detectAmountCurrency(cols[mapping.balanceIndex]);
      if (!isNaN(bal)) balance = bal;
    }

    rows.push({ date, amount, type, description, balance, currency });
  }

  return rows;
}
