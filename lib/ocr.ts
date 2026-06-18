export interface OCRResult {
  amount: number | null;
  merchant: string | null;
  date: string | null;
  transactionType: 'credit' | 'debit' | null;
  rawText: string;
}

export function extractTransactionInfo(recognizedText: string): OCRResult {
  const result: OCRResult = {
    amount: null,
    merchant: null,
    date: null,
    transactionType: null,
    rawText: recognizedText,
  };

  const lines = recognizedText.split('\n').map((l) => l.trim()).filter(Boolean);
  const text = recognizedText;

  result.amount = extractAmount(text);
  result.transactionType = extractType(text);
  result.date = extractDate(text);
  result.merchant = extractMerchant(lines, text);

  return result;
}

function extractAmount(text: string): number | null {
  const patterns = [
    /(?:total|amount|amt|sum)\s*(?:due|paid|:)?\s*(?:NGN|₦|N)?\s*([\d,]+\.\d{2})/i,
    /(?:NGN|₦|N)\s*([\d,]+\.\d{2})/i,
    /([\d,]+\.\d{2})\s*(?:NGN|₦|N)/i,
  ];

  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const n = parseFloat(m[1].replace(/,/g, ''));
      if (!isNaN(n) && n > 0) return n;
    }
  }

  const numberPattern = /(\d{1,3}(?:,\d{3})*\.\d{2})/g;
  const matches = [...text.matchAll(numberPattern)];
  if (matches.length === 1) {
    const n = parseFloat(matches[0][1].replace(/,/g, ''));
    if (!isNaN(n) && n > 0) return n;
  }

  return null;
}

function extractType(text: string): 'credit' | 'debit' | null {
  const lower = text.toLowerCase();

  const creditWords = ['credit', 'credited', 'received', 'deposit', 'payment received', 'refund', 'cash in'];
  const debitWords = ['debit', 'debited', 'payment', 'purchase', 'withdrawal', 'cash out', 'paid', 'charge'];

  let creditScore = 0;
  let debitScore = 0;

  for (const w of creditWords) {
    if (lower.includes(w)) creditScore++;
  }
  for (const w of debitWords) {
    if (lower.includes(w)) debitScore++;
  }

  if (creditScore > debitScore) return 'credit';
  if (debitScore > creditScore) return 'debit';
  return null;
}

function extractDate(text: string): string | null {
  const patterns = [
    /(\d{2})\/(\d{2})\/(\d{4})/,
    /(\d{4})-(\d{2})-(\d{2})/,
    /(\d{2})-([A-Za-z]{3})-(\d{4})/,
    /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})/i,
  ];

  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[0];
  }

  return null;
}

function extractMerchant(lines: string[], text: string): string | null {
  for (const line of lines) {
    if (
      /(?:store|merchant|vendor|company|business|shop|restaurant|supermarket|market)/i.test(line) &&
      !/total|amount|date|balance|address|phone|tin|receipt|vat|tax/i.test(line)
    ) {
      return line;
    }
  }

  for (const line of lines) {
    if (
      /^[A-Z][A-Za-z\s]+$/.test(line.trim()) &&
      line.trim().split(/\s+/).length >= 2 &&
      line.trim().length > 5 &&
      line.trim().length < 40
    ) {
      return line.trim();
    }
  }

  return null;
}

export async function recognizeText(imageUri: string): Promise<string> {
  try {
    const MLKit = require('@react-native-ml-kit/text-recognition');
    const result = await MLKit.recognize(imageUri);
    return result?.text || '';
  } catch {
    const Tesseract = require('react-native-tesseract-ocr');
    const result = await Tesseract.recognize(imageUri, 'LANG_ENGLISH');
    return result || '';
  }
}
