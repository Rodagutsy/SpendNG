import { normalizeType, isReversal, isFee, isLoanRelated } from './normalizer';

export interface ParsedTransaction {
  amount: number;
  currency: string;
  transactionType: 'credit' | 'debit';
  merchantName: string | null;
  accountName: string | null;
  accountNumberLast4: string | null;
  transactionDate: number;
  availableBalance: number | null;
  sourceChannel: 'sms' | 'email';
  parseConfidence: 'high' | 'medium' | 'low';
  rawSourceText?: string;
}

const MONTH_MAP: Record<string, string> = {
  "Jan": "01", "Feb": "02", "Mar": "03", "Apr": "04",
  "May": "05", "Jun": "06", "Jul": "07", "Aug": "08",
  "Sep": "09", "Oct": "10", "Nov": "11", "Dec": "12",
  "JAN": "01", "FEB": "02", "MAR": "03", "APR": "04",
  "MAY": "05", "JUN": "06", "JUL": "07", "AUG": "08",
  "SEP": "09", "OCT": "10", "NOV": "11", "DEC": "12"
};

const SENDER_PATTERNS: Record<string, RegExp> = {
  'GTBank': /gtbank|^gtb$/i,
  'Access Bank': /access\s*bank|^access$/i,
  'Zenith Bank': /zenith\s*bank|^zenith$|alertz/i,
  'FirstBank': /first\s*bank|^firstbank$|^fbn$/i,
  'UBA': /^uba(group)?$/i,
  'Kuda': /kuda/i,
  'OPay': /opay(-ng)?/i,
  'Moniepoint': /moniepoint/i,
  'PalmPay': /palmpay/i,
  'Fidelity Bank': /fidelity|fidelitybnk/i,
  'FCMB': /fcmb(ank)?/i,
  'Wema Bank': /wema/i,
  'Stanbic IBTC': /stanbic/i,
  'Ecobank': /ecobank(ng)?/i,
  'Polaris Bank': /polaris/i,
  'Sterling Bank': /sterling/i,
  'Providus Bank': /providus|providusbnk/i,
};

const AMOUNT_PATTERNS: Record<string, RegExp> = {
  'GTBank': /(?:Amt|Amount):\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
  'Access Bank': /Amt:\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
  'Zenith Bank': /(?:CR|DR):\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
  'FirstBank': /(?:Credit|Debit):\s*(?:\d{3}X{4}\d{3}\s+)?\w+:\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
  'UBA': /(?:Credit|Debit)\s*Amt:\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
  'Kuda': /(?:spent|received)\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
  'OPay': /(?:Credit|Debit):\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
  'Moniepoint': /(?:NGN|₦)\s*([\d,]+\.\d{2}?)\s*(?:received|successful)/i,
  'PalmPay': /(?:received|spent\s+on)\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
  'Fidelity Bank': /(?:CR|DR):\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
  'FCMB': /(?:Debit|Credit):\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
  'Wema Bank': /(?:CR|DR)\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
  'Stanbic IBTC': /(?:Debit|Credit)\s*Amt:\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
  'Ecobank': /(?:Credit|Debit):\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
  'Polaris Bank': /(?:DR|CR):\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
  'Providus Bank': /(?:NGN|₦)\s*([\d,]+\.\d{2}?)\s*credited/i,
};

const CREDIT_PATTERNS: Record<string, RegExp> = {
  'GTBank': /\bCR\b/,
  'Access Bank': /CREDIT ALERT/i,
  'Zenith Bank': /\bCR:\s*(?:NGN|₦)?/,
  'FirstBank': /\bCredit:\s*(?:\d{3}X{4}\d{3}\s+)?\w+:\s*(?:NGN|₦)?/i,
  'UBA': /Credit Amt:/i,
  'Kuda': /You received/i,
  'OPay': /Credit:\s*(?:NGN|₦)?/i,
  'Moniepoint': /received successfully/i,
  'PalmPay': /You received/i,
  'Fidelity Bank': /\bCR:\s*(?:NGN|₦)?/,
  'FCMB': /\bCredit:\s*(?:NGN|₦)?/,
  'Wema Bank': /\bCR\s+(?:NGN|₦)?/,
  'Stanbic IBTC': /Credit Amt:/i,
  'Ecobank': /Credit:\s*(?:NGN|₦)?/i,
  'Polaris Bank': /\bCR:\s*(?:NGN|₦)?/,
  'Providus Bank': /credited to your account/i,
  'default': /(?:credit|credited|received|deposit|inflow)/i,
};

const DEBIT_PATTERNS: Record<string, RegExp> = {
  'GTBank': /\bDR\b/,
  'Access Bank': /DEBIT ALERT/i,
  'Zenith Bank': /\bDR:\s*(?:NGN|₦)?/,
  'FirstBank': /\bDebit:\s*(?:\d{3}X{4}\d{3}\s+)?\w+:\s*(?:NGN|₦)?/i,
  'UBA': /Debit Amt:/i,
  'Kuda': /You spent/i,
  'OPay': /Debit:\s*(?:NGN|₦)?/i,
  'Moniepoint': /(?:Transfer of|debited|spent|withdrawal|payment)/i,
  'PalmPay': /was spent on/i,
  'Fidelity Bank': /\bDR:\s*(?:NGN|₦)?/,
  'FCMB': /\bDebit:\s*(?:NGN|₦)?/,
  'Wema Bank': /\bDR\s+(?:NGN|₦)?/,
  'Stanbic IBTC': /Debit Amt:/i,
  'Ecobank': /Debit:\s*(?:NGN|₦)?/i,
  'Polaris Bank': /\bDR:\s*(?:NGN|₦)?/,
  'Providus Bank': /debited from your account/i,
  'default': /(?:debit|debited|spent|payment|withdrawal|purchase)/i,
};

const MERCHANT_PATTERNS: Record<string, RegExp> = {
  'GTBank': /Desc:\s*(?:Transfer from\s+)?(.+?)(?:\n|$)/i,
  'Access Bank': /From:\s*(.+?)(?:\n|$)/i,
  'Zenith Bank': /Desc:\s*(.+?)(?:\n|$)/i,
  'FirstBank': /(?:Narration|Desc):\s*(.+?)(?=\s*(?:\.\s*(?:Avail(?:able)?\s*)?Bal|\n|$))/i,
  'UBA': /(?:From|Desc):\s*(.+?)(?=\s*(?:\.\s*(?:Avail(?:able)?\s*)?Bal|\n|$))/i,
  'Kuda': /(?:Merchant|From):\s*(.+?)(?=\s*(?:\.\s*(?:Avail(?:able)?\s*)?Bal|\n|$))/i,
  'OPay': /(?:Sender|Transaction):\s*(.+?)(?=\s*(?:\.\s*(?:Avail(?:able)?\s*)?Bal|\n|$))/i,
  'Moniepoint': /(?:Sender|Recipient):\s*(.+?)(?=\s*(?:\.\s*(?:Avail(?:able)?\s*)?Bal|\n|$))/i,
  'PalmPay': /(?:was spent on\s+|received\s+(?:.*?\s+)from\s+|From:\s*)(.+?)(?=\s*(?:\.\s*(?:Avail(?:able)?\s*)?Bal|\.\s*From|\..*$|\n|$))/i,
  'Fidelity Bank': /Desc:\s*(.+?)(?=\s*(?:\.\s*(?:Avail(?:able)?\s*)?Bal|\n|$))/i,
  'FCMB': /Desc:\s*(.+?)(?=\s*(?:\.\s*(?:Avail(?:able)?\s*)?Bal|\n|$))/i,
  'Wema Bank': /Narration:\s*(.+?)(?=\s*(?:\.\s*(?:Avail(?:able)?\s*)?Bal|\n|$))/i,
  'Stanbic IBTC': /Narration:\s*(.+?)(?=\s*(?:\.\s*(?:Avail(?:able)?\s*)?Bal|\n|$))/i,
  'Ecobank': /Desc:\s*(.+?)(?=\s*(?:\.\s*(?:Avail(?:able)?\s*)?Bal|\n|$))/i,
  'Polaris Bank': /Desc:\s*(.+?)(?=\s*(?:\.\s*(?:Avail(?:able)?\s*)?Bal|\n|$))/i,
  'Sterling Bank': /Desc:\s*(.+?)(?=\s*(?:\.\s*(?:Avail(?:able)?\s*)?Bal|\n|$))/i,
  'Providus Bank': /Desc:\s*(.+?)(?=\s*(?:\.\s*(?:Avail(?:able)?\s*)?Bal|\n|$))/i,
  'default': /(?:Desc|Narration|From|Sender|Merchant|Beneficiary):\s*(.+?)(?=\s*(?:\.\s*(?:Avail(?:able)?\s*)?Bal|\n|$))/i,
};

const BALANCE_PATTERNS: Record<string, RegExp> = {
  'default': /(?:Avail(?:able)?\s*)?Bal(?:ance)?:\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
  'Kuda': /Balance:\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
  'Moniepoint': /Available Balance:\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
};

const DATE_PATTERNS: Record<string, RegExp> = {
  'GTBank': /Date:\s*(\d{2})-([A-Za-z]{3})-(\d{4})\s+(\d{1,2}):(\d{2})/i,
  'Access Bank': /Date:\s*(\d{2})\/(\d{2})\/(\d{4})/i,
  'Zenith Bank': /Date:\s*(\d{2})-([A-Z]{3})-(\d{4})\s+(\d{1,2}):(\d{2})/i,
  'FirstBank': /Date:\s*(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2}):(\d{2})/i,
  'UBA': /Date:\s*(\d{2})-([A-Za-z]{3})-(\d{4})\s+(\d{1,2}):(\d{2})/i,
  'Kuda': /Time:\s*(\d{1,2}):(\d{2})/i,
  'OPay': /Time:\s*(\d{1,2})-([A-Za-z]{3})-(\d{4})\s+(\d{1,2}):(\d{2})/i,
  'Moniepoint': /(\d{2})-([A-Za-z]{3})-(\d{4})\s+(\d{1,2}):(\d{2})/i,
  'PalmPay': /Time:\s*(\d{1,2}):(\d{2})/i,
  'Fidelity Bank': /Date:\s*(\d{2})\/(\d{2})\/(\d{4})/i,
  'FCMB': /Date:\s*(\d{2})-([A-Za-z]{3})-(\d{4})/i,
  'Wema Bank': /(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2}):(\d{2})/i,
  'Stanbic IBTC': /Date:\s*(\d{2})-([A-Za-z]{3})-(\d{4})/i,
  'Ecobank': /(\d{2})-([A-Za-z]{3})-(\d{4})\s+(\d{1,2}):(\d{2})/i,
  'Polaris Bank': /Date:\s*(\d{2})\/(\d{2})\/(\d{4})/i,
  'Providus Bank': /Time:\s*(\d{1,2})-([A-Za-z]{3})-(\d{4})\s+(\d{1,2}):(\d{2})/i,
};

const GENERIC_DATE_PATTERNS: { pattern: RegExp; isMonthName: boolean }[] = [
  { pattern: /Date:\s*(\d{2})-([A-Za-z]{3})-(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(?:AM|PM)?/i, isMonthName: true },
  { pattern: /Date:\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(?:AM|PM)?/i, isMonthName: false },
  { pattern: /Date:\s*(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(?:AM|PM)?/i, isMonthName: false },
  { pattern: /(\d{2})-([A-Za-z]{3})-(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(?:AM|PM)?/i, isMonthName: true },
  { pattern: /(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(?:AM|PM)?/i, isMonthName: false },
  { pattern: /Date:\s*(\d{2})-([A-Za-z]{3})-(\d{4})/i, isMonthName: true },
  { pattern: /Date:\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/i, isMonthName: false },
  { pattern: /Date:\s*(\d{4})-(\d{2})-(\d{2})/i, isMonthName: false },
  { pattern: /Time:\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(?:AM|PM)?/i, isMonthName: false },
];

function parseNGN(value: string): number {
  return parseFloat(value.replace(/,/g, ''));
}

function safeMatch(pattern: RegExp, body: string): RegExpMatchArray | null {
  pattern.lastIndex = 0;
  return body.match(pattern);
}

const GENERIC_AMOUNT_PATTERNS: RegExp[] = [
  /(?:Amt|Amount):\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
  /(?:Credit|Debit):\s*(?:\d{3}X{4}\d{3}\s+)?\w+:\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
  /(?:Credit|Debit):\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
  /(?:CR|DR):\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
  /(?:CR|DR)\s+(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
  /(?:spent|received)\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
  /(?:NGN|₦)\s*([\d,]+\.\d{2}?)\s*(?:received|successful)/i,
  /(?:received|spent\s+on)\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
  /(?:NGN|₦)\s*([\d,]+\.\d{2}?)\s*credited/i,
  /(?:NGN|₦)\s*([\d,]+\.\d{2})/i,
];

const GENERIC_TYPE_PATTERNS = {
  credit: [
    /\bCR\b(?!\s*EDIT)/i,
    /Credit:\s*(?:\d{3}X{4}\d{3}\s+)?\w+:\s*(?:NGN|₦)?/i,
    /Credit\s+Amt:/i,
    /CREDIT ALERT/i,
    /You received/i,
    /received successfully/i,
    /credited to your account/i,
    /(?:^|\s)Credit(?:\s|:)/i,
    /(?:credit|credited|received|deposit|inflow)/i,
  ],
  debit: [
    /\bDR\b(?!\s*AW)/i,
    /Debit:\s*(?:\d{3}X{4}\d{3}\s+)?\w+:\s*(?:NGN|₦)?/i,
    /Debit\s+Amt:/i,
    /DEBIT ALERT/i,
    /You spent/i,
    /was spent on/i,
    /debited from your account/i,
    /(?:^|\s)Debit(?:\s|:)/i,
    /(?:debit|debited|spent|payment|withdrawal|purchase)/i,
  ],
};

const GENERIC_MERCHANT_PATTERNS: RegExp[] = [
  /(?:Desc|Narration|From|Sender|Merchant|Beneficiary):\s*(.+?)(?=\s*(?:\.\s*(?:Avail(?:able)?\s*)?Bal|\n|$))/i,
  /(?:Desc|Narration|From|Sender|Merchant|Beneficiary):\s*(.+?)(?:\n|$)/i,
];

const GENERIC_BALANCE_PATTERNS: RegExp[] = [
  /(?:Avail(?:able)?\s*)?Bal(?:ance)?:\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
  /Available Balance:\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
];

const GENERIC_ACCOUNT_PATTERNS: { pattern: RegExp; extractLast4: (match: string[]) => string | null }[] = [
  { pattern: /Acct:\s*\*{4}(\d{4})/i, extractLast4: (m) => m[1] },
  { pattern: /Acct:\s*(\d{3})\*{4}(\d{3})/i, extractLast4: (m) => m[2] },
  { pattern: /Acct:\s*(\d{10})/i, extractLast4: (m) => m[1].slice(-4) },
  { pattern: /(?:Credit|Debit):\s*(\d{3})X{4}(\d{3})/i, extractLast4: (m) => m[2] },
  { pattern: /(?:\d{3})\*{4}(\d{3})/i, extractLast4: (m) => m[1] },
  { pattern: /(?:\d{3})X{4}(\d{3})/i, extractLast4: (m) => m[1] },
];

function tryGenericDate(body: string): number | null {
  for (const { pattern, isMonthName } of GENERIC_DATE_PATTERNS) {
    const match = safeMatch(pattern, body);
    if (!match) continue;

    if (isMonthName && match[2] && MONTH_MAP[match[2]]) {
      const m = match as RegExpMatchArray & { [key: string]: string };
      const day = m[1].padStart(2, '0');
      const month = MONTH_MAP[m[2]];
      const year = m[3];
      const hour = m[4] ? m[4].padStart(2, '0') : '00';
      const min = m[5] ? m[5].padStart(2, '0') : '00';
      const parsed = new Date(`${year}-${month}-${day}T${hour}:${min}:00`).getTime();
      if (!isNaN(parsed)) return parsed;
    }

    if (!isMonthName && match[2] && match[3]) {
      const groups = match as unknown as string[];
      const year = groups[3].length === 4 ? groups[3] : groups[1];
      const month = groups[3].length === 4 ? groups[2] : groups[1];
      const day = groups[3].length === 4 ? groups[1] : groups[2];
      const hour = groups[4] ? groups[4].padStart(2, '0') : '00';
      const min = groups[5] ? groups[5].padStart(2, '0') : '00';

      const y = year.length === 4 ? year : `20${groups[3]}`;
      const m = month.padStart(2, '0');
      const d = day.padStart(2, '0');
      const parsed = new Date(`${y}-${m}-${d}T${hour}:${min}:00`).getTime();
      if (!isNaN(parsed)) return parsed;
    }
  }
  return null;
}

function tryGenericAmount(body: string): number | null {
  for (const p of GENERIC_AMOUNT_PATTERNS) {
    const match = safeMatch(p, body);
    if (match) return parseNGN(match[1]);
  }
  return null;
}

function tryGenericType(body: string): 'credit' | 'debit' | null {
  let isDebit = false;
  let isCredit = false;

  for (const p of GENERIC_TYPE_PATTERNS.debit) {
    if (safeMatch(p, body)) { isDebit = true; break; }
  }
  for (const p of GENERIC_TYPE_PATTERNS.credit) {
    if (safeMatch(p, body)) { isCredit = true; break; }
  }

  if (isDebit && !isCredit) return 'debit';
  if (isCredit && !isDebit) return 'credit';
  if (isDebit && isCredit) {
    const lower = body.toLowerCase();
    if (lower.includes('spent') || lower.includes('payment')) return 'debit';
    if (lower.includes('received') || lower.includes('credited')) return 'credit';
  }
  return null;
}

function tryGenericMerchant(body: string): string | null {
  for (const p of GENERIC_MERCHANT_PATTERNS) {
    const match = safeMatch(p, body);
    if (match) {
      return match[1]
        .replace(/^(?:Transfer from|Transfer to|From|To)\s+/i, '')
        .replace(/\s+/g, ' ')
        .trim();
    }
  }
  return null;
}

function tryGenericBalance(body: string): number | null {
  for (const p of GENERIC_BALANCE_PATTERNS) {
    const match = safeMatch(p, body);
    if (match) return parseNGN(match[1]);
  }
  return null;
}

function tryGenericCurrency(body: string): string {
  if (/[$]/.test(body) && /USD/i.test(body)) return 'USD';
  if (/[£]/.test(body) && /GBP/i.test(body)) return 'GBP';
  if (/[€]/.test(body) && /EUR/i.test(body)) return 'EUR';
  if (/\bUSD\b/.test(body)) return 'USD';
  if (/\bGBP\b/.test(body)) return 'GBP';
  if (/\bEUR\b/.test(body)) return 'EUR';
  if (/[$]/.test(body)) return 'USD';
  if (/[£]/.test(body)) return 'GBP';
  if (/[€]/.test(body)) return 'EUR';
  return 'NGN';
}

function tryGenericAccountInfo(body: string): { last4: string | null } {
  for (const { pattern, extractLast4 } of GENERIC_ACCOUNT_PATTERNS) {
    const match = safeMatch(pattern, body);
    if (match) {
      const last4 = extractLast4(match as unknown as string[]);
      if (last4) return { last4 };
    }
  }
  return { last4: null };
}

export class Parser {
  static parseSMS(body: string, sender: string, timestamp: number, debug?: boolean): ParsedTransaction | null {
    const bank = this.identifyBank(sender);
    if (debug) console.log(`[Parser] Bank identified: ${bank || 'null'} from sender: ${sender}`);

    let results: Record<string, any> = {};

    if (bank) {
      results = this.extractSMSWithBank(body, bank, timestamp, debug);
    } else {
      if (debug) console.log('[Parser] No bank match, using generic fallback');
    }

    if (!results.amount) {
      const genericAmount = tryGenericAmount(body);
      if (genericAmount !== null) results.amount = genericAmount;
    }
    if (!results.type) {
      const genericType = tryGenericType(body);
      if (genericType) results.type = genericType;
    }

    if (!results.merchant) {
      const genericMerchant = tryGenericMerchant(body);
      if (genericMerchant) results.merchant = genericMerchant;
    }
    if (results.balance === null || results.balance === undefined) {
      const genericBalance = tryGenericBalance(body);
      if (genericBalance !== null) results.balance = genericBalance;
    }
    if (!results.last4) {
      const genericAccount = tryGenericAccountInfo(body);
      results.last4 = genericAccount.last4;
    }
    if (!results.transactionDate) {
      const genericDate = tryGenericDate(body);
      if (genericDate !== null) {
        results.transactionDate = genericDate;
        if (debug) console.log('[Parser] Date recovered via generic patterns');
      }
    }

    if (isReversal(body)) {
      results.type = 'credit';
      if (!results.merchant) results.merchant = 'Reversal/Refund';
      if (debug) console.log('[Parser] Detected reversal/refund');
    }

    if (isFee(body) && !results.merchant) {
      results.merchant = 'Bank Charge';
      if (debug) console.log('[Parser] Detected bank charge/fee');
    }

    if (isLoanRelated(body) && !results.merchant) {
      results.merchant = 'Loan Repayment';
      if (debug) console.log('[Parser] Detected loan related transaction');
    }

    const date = results.transactionDate || timestamp;
    const confidence: 'high' | 'medium' | 'low' =
      (results.merchant || results.type) && results.balance !== null ? 'high'
      : (results.merchant || results.type) ? 'medium'
      : 'low';

    if (results.amount === null || results.amount === undefined) {
      if (debug) console.log('[Parser] Failed: no amount extracted');
      return null;
    }
    if (!results.type) {
      if (debug) console.log('[Parser] Failed: no transaction type extracted');
      return null;
    }

    if (debug) console.log('[Parser] Final result:', {
      amount: results.amount,
      type: results.type,
      merchant: results.merchant,
      date: new Date(date).toISOString(),
      balance: results.balance,
      last4: results.last4,
      confidence,
    });

    const detectedCurrency = tryGenericCurrency(body);

    return {
      amount: results.amount,
      currency: detectedCurrency,
      transactionType: results.type,
      merchantName: results.merchant || null,
      accountName: results.accountName || bank || 'Unknown',
      accountNumberLast4: results.last4 || null,
      transactionDate: date,
      availableBalance: results.balance !== null && results.balance !== undefined ? results.balance : null,
      sourceChannel: 'sms',
      parseConfidence: confidence,
      rawSourceText: body,
    };
  }

  private static extractSMSWithBank(body: string, bank: string, timestamp: number, debug?: boolean): Record<string, any> {
    const amount = this.extractAmount(body, bank, debug);
    const type = this.extractType(body, bank, debug);
    const date = this.extractDate(body, bank, debug, timestamp);
    const merchant = this.extractMerchant(body, bank, debug);
    const balance = this.extractBalance(body, bank, debug);
    const { last4 } = this.extractAccountInfo(body, bank);

    return { amount, type, transactionDate: date, merchant, balance, last4, accountName: bank };
  }

  static parseEmail(body: string, fromAddress: string, timestamp: number): ParsedTransaction | null {
    const emailSenders: Record<string, string> = {
      'alerts@gtbank.com': 'GTBank',
      'alerts@accessbankplc.com': 'Access Bank',
      'alert@firstbanknigeria.com': 'FirstBank',
      'alert@zenithbank.com': 'Zenith Bank',
      'alerts@ubagroup.com': 'UBA',
      'notifications@kuda.co': 'Kuda',
      'alerts@opay.africa': 'OPay',
      'hello@grey.co': 'Grey',
      'notifications@geegpay.com': 'Geegpay',
      'transfers@lemfi.com': 'Lemfi',
    };

    const bank = Object.entries(emailSenders).find(([addr]) =>
      fromAddress.toLowerCase().includes(addr.toLowerCase())
    )?.[1];

    if (!bank) return null;

    const amount = this.extractAmount(body, bank) ?? this.extractEmailAmount(body);
    if (amount === null) return null;

    const currency = this.extractCurrency(body);
    const type = this.extractType(body, bank) ?? this.extractEmailType(body);
    const date = this.extractDate(body, bank) || this.extractEmailDate(body) || timestamp;
    const merchant = this.extractMerchant(body, bank) || this.extractEmailMerchant(body);
    const balance = this.extractBalance(body, bank);
    const { accountName, last4 } = this.extractAccountInfo(body, bank);

    const confidence: 'high' | 'medium' | 'low' =
      merchant && balance ? 'high'
      : merchant || balance ? 'medium'
      : 'low';

    return {
      amount,
      currency,
      transactionType: type || 'debit',
      merchantName: merchant,
      accountName: accountName || bank,
      accountNumberLast4: last4,
      transactionDate: date,
      availableBalance: balance,
      sourceChannel: 'email',
      parseConfidence: confidence,
      rawSourceText: body,
    };
  }

  static identifyBank(sender: string): string | null {
    for (const [bank, pattern] of Object.entries(SENDER_PATTERNS)) {
      if (pattern.test(sender.trim())) return bank;
    }
    return null;
  }

  private static extractAmount(body: string, bank: string, debug?: boolean): number | null {
    const pattern = AMOUNT_PATTERNS[bank];
    if (pattern) {
      const match = safeMatch(pattern, body);
      if (match) {
        if (debug) console.log(`[Parser/${bank}] Amount matched bank pattern: ${match[1]}`);
        return parseNGN(match[1]);
      }
    }

    const genericAmount = tryGenericAmount(body);
    if (genericAmount !== null) {
      if (debug) console.log(`[Parser/${bank}] Amount matched generic fallback: ${genericAmount}`);
    }
    return genericAmount;
  }

  private static extractType(body: string, bank: string, debug?: boolean): 'credit' | 'debit' | null {
    const debitPattern = DEBIT_PATTERNS[bank] || DEBIT_PATTERNS.default;
    const creditPattern = CREDIT_PATTERNS[bank] || CREDIT_PATTERNS.default;

    const isDebit = safeMatch(debitPattern, body) !== null;
    const isCredit = safeMatch(creditPattern, body) !== null;

    if (debug) console.log(`[Parser/${bank}] Type: isDebit=${isDebit}, isCredit=${isCredit}`);

    if (isDebit && !isCredit) return 'debit';
    if (isCredit && !isDebit) return 'credit';
    if (isDebit && isCredit) {
      const lower = body.toLowerCase();
      if (lower.includes('spent') || lower.includes('payment')) return 'debit';
      if (lower.includes('received') || lower.includes('credited')) return 'credit';
    }

    const genericType = tryGenericType(body);
    if (genericType) {
      if (debug) console.log(`[Parser/${bank}] Type recovered via generic fallback: ${genericType}`);
      return genericType;
    }

    const normalizedType = normalizeType(body);
    if (normalizedType) {
      if (debug) console.log(`[Parser/${bank}] Type recovered via normalizer: ${normalizedType}`);
    }
    return normalizedType;
  }

  private static extractDate(body: string, bank: string, debug?: boolean, smsTimestamp?: number): number | null {
    const pattern = DATE_PATTERNS[bank];
    if (pattern) {
      const match = safeMatch(pattern, body);
      if (match) {
        if (bank === 'Kuda' || bank === 'PalmPay') {
          const hour = parseInt(match[1], 10);
          const min = parseInt(match[2], 10);
          if (!isNaN(hour) && !isNaN(min)) {
            const base = smsTimestamp ? new Date(smsTimestamp) : new Date();
            base.setHours(hour, min, 0, 0);
            return base.getTime();
          }
          return smsTimestamp || Date.now();
        }

        if (match[2] && MONTH_MAP[match[2]]) {
          const day = match[1].padStart(2, '0');
          const month = MONTH_MAP[match[2]];
          const year = match[3];
          const hour = match[4] ? match[4].padStart(2, '0') : '00';
          const min = match[5] ? match[5].padStart(2, '0') : '00';
          const parsed = new Date(`${year}-${month}-${day}T${hour}:${min}:00`).getTime();
          if (!isNaN(parsed)) {
            if (debug) console.log(`[Parser/${bank}] Date matched bank pattern: ${year}-${month}-${day}T${hour}:${min}`);
            return parsed;
          }
        }

        if (match[2] && match[3]) {
          const day = match[1].padStart(2, '0');
          const month = match[2].padStart(2, '0');
          const year = match[3];
          const parsed = new Date(`${year}-${month}-${day}`).getTime();
          if (!isNaN(parsed)) {
            if (debug) console.log(`[Parser/${bank}] Date matched bank pattern (numeric): ${year}-${month}-${day}`);
            return parsed;
          }
        }
      }
    }

    const genericDate = tryGenericDate(body);
    if (genericDate !== null && debug) console.log(`[Parser/${bank}] Date recovered via generic patterns`);
    return genericDate;
  }

  private static extractMerchant(body: string, bank: string, debug?: boolean): string | null {
    const pattern = MERCHANT_PATTERNS[bank] || MERCHANT_PATTERNS.default;
    const match = safeMatch(pattern, body);
    if (match) {
      const merchant = match[1]
        .replace(/^(?:Transfer from|Transfer to|From|To)\s+/i, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (merchant) {
        if (debug) console.log(`[Parser/${bank}] Merchant matched: ${merchant}`);
        return merchant;
      }
    }

    const genericMerchant = tryGenericMerchant(body);
    if (genericMerchant && debug) console.log(`[Parser/${bank}] Merchant recovered via generic: ${genericMerchant}`);
    return genericMerchant;
  }

  private static extractBalance(body: string, bank: string, debug?: boolean): number | null {
    const pattern = BALANCE_PATTERNS[bank] || BALANCE_PATTERNS.default;
    const match = safeMatch(pattern, body);
    if (match) {
      if (debug) console.log(`[Parser/${bank}] Balance matched: ${match[1]}`);
      return parseNGN(match[1]);
    }

    const genericBalance = tryGenericBalance(body);
    if (genericBalance !== null && debug) console.log(`[Parser/${bank}] Balance recovered via generic: ${genericBalance}`);
    return genericBalance;
  }

  private static extractAccountInfo(body: string, bank: string) {
    const genericResult = tryGenericAccountInfo(body);
    if (genericResult.last4) {
      return { accountName: bank, last4: genericResult.last4 };
    }

    const match = safeMatch(/Acct:\s*(\d{3}\*{4}\d{3}|\d{10})/i, body);
    if (match) {
      const full = match[1];
      const last4 = full.slice(-4);
      return { accountName: bank, last4 };
    }
    return { accountName: bank, last4: null };
  }

  private static extractEmailAmount(body: string): number | null {
    const match = safeMatch(/(?:NGN|₦|\$|£|USD|GBP)\s*([\d,]+\.\d{2})/i, body);
    return match ? parseNGN(match[1]) : null;
  }

  private static extractCurrency(body: string): string {
    if (/£|GBP/i.test(body)) return 'GBP';
    if (/\$|USD/i.test(body)) return 'USD';
    return 'NGN';
  }

  private static extractEmailType(body: string): 'credit' | 'debit' {
    const lower = body.toLowerCase();
    if (lower.includes('debit') || lower.includes('spent') || lower.includes('payment')) return 'debit';
    return 'credit';
  }

  private static extractEmailMerchant(body: string): string | null {
    const match = safeMatch(/(?:Dear|Hi|Hello)\s+(\w+)/i, body);
    return match ? match[1] : null;
  }

  private static extractEmailDate(body: string): number | null {
    const match = safeMatch(/(?:\bDate\b|\bTime\b):\s*([^\n\r]+)/i, body);
    if (match) {
      const parsed = Date.parse(match[1].trim());
      if (!isNaN(parsed)) return parsed;
    }
    return null;
  }
}
