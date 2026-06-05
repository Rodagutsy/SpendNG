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
  'GTBank': /^GT[Bb]ank|^GTB$|^GTBANK$/,
  'Access Bank': /^Access[Bb]ank|^ACCESS(BANK)?$/,
  'Zenith Bank': /^Zenith[Bb]ank|^ZENITH$|^AlertZ$/,
  'FirstBank': /^First[Bb]ank|^FIRSTBANK$|^FBN$/,
  'UBA': /^UBA(Group)?$/,
  'Kuda': /^Kuda$|^KUDA$/,
  'OPay': /^OPay(-NG)?$|^OPAY$/,
  'Moniepoint': /^Moniepoint$|^MONIEPOINT$/,
  'PalmPay': /^PalmPay$|^PALMPAY$/,
  'Fidelity Bank': /^Fidelity(Bnk)?$|^FIDELITY$/,
  'FCMB': /^FCMB(ank)?$/,
  'Wema Bank': /^Wema([Bb]ank)?$|^WEMA$/,
  'Stanbic IBTC': /^Stanbic(IBTC)?$|^STANBIC$/,
  'Ecobank': /^Ecobank(NG)?$|^ECOBANK$/,
  'Polaris Bank': /^Polaris([Bb]ank)?$|^POLARIS$/,
  'Sterling Bank': /^Sterling([Bb]ank)?$|^STERLING$/,
  'Providus Bank': /^Providus(Bnk)?$|^PROVIDUS$/,
};

const AMOUNT_PATTERNS: Record<string, RegExp> = {
  'GTBank': /(?:Amt|Amount):\s*NGN\s*([\d,]+\.\d{2})/i,
  'Access Bank': /Amt:\s*NGN\s*([\d,]+\.\d{2})/i,
  'Zenith Bank': /(?:CR|DR):\s*NGN\s*([\d,]+\.\d{2})/i,
  'FirstBank': /(?:Credit|Debit):\s*NGN\s*([\d,]+\.\d{2})/i,
  'UBA': /(?:Credit|Debit)\s*Amt:\s*NGN\s*([\d,]+\.\d{2})/i,
  'Kuda': /(?:spent|received)\s*NGN\s*([\d,]+\.\d{2})/i,
  'OPay': /(?:Credit|Debit):\s*NGN\s*([\d,]+\.\d{2})/i,
  'Moniepoint': /NGN\s*([\d,]+\.\d{2}?)\s*(?:received|successful)/i,
  'PalmPay': /(?:received|spent\s+on)\s*NGN\s*([\d,]+\.\d{2})/i,
  'Fidelity Bank': /(?:CR|DR):\s*NGN\s*([\d,]+\.\d{2})/i,
  'FCMB': /(?:Debit|Credit):\s*NGN\s*([\d,]+\.\d{2})/i,
  'Wema Bank': /(?:CR|DR)\s*NGN\s*([\d,]+\.\d{2})/i,
  'Stanbic IBTC': /(?:Debit|Credit)\s*Amt:\s*NGN\s*([\d,]+\.\d{2})/i,
  'Ecobank': /(?:Credit|Debit):\s*NGN\s*([\d,]+\.\d{2})/i,
  'Polaris Bank': /(?:DR|CR):\s*NGN\s*([\d,]+\.\d{2})/i,
  'Providus Bank': /NGN\s*([\d,]+\.\d{2}?)\s*credited/i,
};

const CREDIT_PATTERNS: Record<string, RegExp> = {
  'GTBank': /\bCR\b/,
  'Access Bank': /CREDIT ALERT/i,
  'Zenith Bank': /\bCR:\s*NGN/,
  'FirstBank': /\bCredit:\s*NGN/,
  'UBA': /Credit Amt:/i,
  'Kuda': /You received/i,
  'OPay': /Credit:\s*NGN/i,
  'Moniepoint': /received successfully/i,
  'PalmPay': /You received/i,
  'Fidelity Bank': /\bCR:\s*NGN/,
  'FCMB': /\bCredit:\s*NGN/,
  'Wema Bank': /\bCR\s+NGN/,
  'Stanbic IBTC': /Credit Amt:/i,
  'Ecobank': /Credit:\s*NGN/i,
  'Polaris Bank': /\bCR:\s*NGN/,
  'Providus Bank': /credited to your account/i,
  'default': /(?:credit|credited|received|deposit|inflow)/i,
};

const DEBIT_PATTERNS: Record<string, RegExp> = {
  'GTBank': /\bDR\b/,
  'Access Bank': /DEBIT ALERT/i,
  'Zenith Bank': /\bDR:\s*NGN/,
  'FirstBank': /\bDebit:\s*NGN/,
  'UBA': /Debit Amt:/i,
  'Kuda': /You spent/i,
  'OPay': /Debit:\s*NGN/i,
  'Moniepoint': /(?:Transfer of|successful)/i,
  'PalmPay': /was spent on/i,
  'Fidelity Bank': /\bDR:\s*NGN/,
  'FCMB': /\bDebit:\s*NGN/,
  'Wema Bank': /\bDR\s+NGN/,
  'Stanbic IBTC': /Debit Amt:/i,
  'Ecobank': /Debit:\s*NGN/i,
  'Polaris Bank': /\bDR:\s*NGN/,
  'Providus Bank': /debited from your account/i,
  'default': /(?:debit|debited|spent|payment|withdrawal|purchase)/i,
};

const DATE_PATTERNS: Record<string, RegExp> = {
  'GTBank': /Date:\s*(\d{2})-([A-Za-z]{3})-(\d{4})\s+(\d{2}):(\d{2})/i,
  'Access Bank': /Date:\s*(\d{2})\/(\d{2})\/(\d{4})/i,
  'Zenith Bank': /Date:\s*(\d{2})-([A-Z]{3})-(\d{4})\s+(\d{2}):(\d{2})/i,
  'FirstBank': /Date:\s*(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/i,
  'UBA': /Date:\s*(\d{2})-([A-Za-z]{3})-(\d{4})\s+(\d{2}):(\d{2})/i,
  'Kuda': /Time:\s*(\d{2}):(\d{2})/i,
  'OPay': /Time:\s*(\d{2})-([A-Za-z]{3})-(\d{4})\s+(\d{2}):(\d{2})/i,
  'Moniepoint': /(\d{2})-([A-Za-z]{3})-(\d{4})\s+(\d{2}):(\d{2})/i,
  'PalmPay': /Time:\s*(\d{2}):(\d{2})/i,
  'Fidelity Bank': /Date:\s*(\d{2})\/(\d{2})\/(\d{4})/i,
  'FCMB': /Date:\s*(\d{2})-([A-Za-z]{3})-(\d{4})/i,
  'Wema Bank': /(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/i,
  'Stanbic IBTC': /Date:\s*(\d{2})-([A-Za-z]{3})-(\d{4})/i,
  'Ecobank': /(\d{2})-([A-Za-z]{3})-(\d{4})\s+(\d{2}):(\d{2})/i,
  'Polaris Bank': /Date:\s*(\d{2})\/(\d{2})\/(\d{4})/i,
  'Providus Bank': /Time:\s*(\d{2})-([A-Za-z]{3})-(\d{4})\s+(\d{2}):(\d{2})/i,
};

const MERCHANT_PATTERNS: Record<string, RegExp> = {
  'GTBank': /Desc:\s*(?:Transfer from\s+)?(.+?)(?:\n|$)/i,
  'Access Bank': /From:\s*(.+?)(?:\n|$)/i,
  'Zenith Bank': /Desc:\s*(.+?)(?:\n|$)/i,
  'FirstBank': /Narration:\s*(.+?)(?:\n|$)/i,
  'UBA': /(?:From|Desc):\s*(.+?)(?:\n|$)/i,
  'Kuda': /(?:Merchant|From):\s*(.+?)(?:\n|$)/i,
  'OPay': /(?:Sender|Transaction):\s*(.+?)(?:\n|$)/i,
  'Moniepoint': /(?:Sender|Recipient):\s*(.+?)(?:\n|$)/i,
  'PalmPay': /From:\s*(.+?)(?:\n|$)/i,
  'default': /(?:Desc|Narration|From|Sender|Merchant|Beneficiary):\s*(.+?)(?:\n|$)/i,
};

const BALANCE_PATTERNS: Record<string, RegExp> = {
  'default': /(?:Avail(?:able)?\s*)?Bal(?:ance)?:\s*NGN\s*([\d,]+\.\d{2})/i,
  'Kuda': /Balance:\s*NGN\s*([\d,]+\.\d{2})/i,
  'Moniepoint': /Available Balance:\s*NGN\s*([\d,]+\.\d{2})/i,
};

export class Parser {
  static parseSMS(body: string, sender: string, timestamp: number): ParsedTransaction | null {
    const bank = this.identifyBank(sender);
    if (!bank) return null;

    const amount = this.extractAmount(body, bank);
    if (amount === null) return null;

    const type = this.extractType(body, bank);
    if (!type) return null;

    const date = this.extractDate(body, bank) || timestamp;
    const merchant = this.extractMerchant(body, bank);
    const balance = this.extractBalance(body, bank);
    const { accountName, last4 } = this.extractAccountInfo(body, bank);

    const confidence: 'high' | 'medium' | 'low' =
      merchant && balance ? 'high'
      : merchant || balance ? 'medium'
      : 'low';

    return {
      amount,
      currency: 'NGN',
      transactionType: type,
      merchantName: merchant,
      accountName: accountName || bank,
      accountNumberLast4: last4,
      transactionDate: date,
      availableBalance: balance,
      sourceChannel: 'sms',
      parseConfidence: confidence,
      rawSourceText: body,
    };
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

    const amount = this.extractEmailAmount(body);
    if (amount === null) return null;

    const currency = this.extractCurrency(body);
    const type = this.extractEmailType(body);
    const date = this.extractEmailDate(body) || timestamp;
    const merchant = this.extractEmailMerchant(body);

    return {
      amount,
      currency,
      transactionType: type,
      merchantName: merchant,
      accountName: bank,
      accountNumberLast4: null,
      transactionDate: date,
      availableBalance: null,
      sourceChannel: 'email',
      parseConfidence: 'medium',
      rawSourceText: body,
    };
  }

  static identifyBank(sender: string): string | null {
    for (const [bank, pattern] of Object.entries(SENDER_PATTERNS)) {
      if (pattern.test(sender)) return bank;
    }
    return null;
  }

  private static extractAmount(body: string, bank: string): number | null {
    const pattern = AMOUNT_PATTERNS[bank];
    const match = body.match(pattern || AMOUNT_PATTERNS['GTBank']);
    if (match) return parseFloat(match[1].replace(/,/g, ''));

    const fallback = body.match(/(?:NGN|₦)\s*([\d,]+\.\d{2})/i);
    if (fallback) return parseFloat(fallback[1].replace(/,/g, ''));

    return null;
  }

  private static extractType(body: string, bank: string): 'credit' | 'debit' | null {
    const debitPattern = DEBIT_PATTERNS[bank] || DEBIT_PATTERNS.default;
    const creditPattern = CREDIT_PATTERNS[bank] || CREDIT_PATTERNS.default;

    const isDebit = debitPattern.test(body);
    const isCredit = creditPattern.test(body);

    if (isDebit && !isCredit) return 'debit';
    if (isCredit && !isDebit) return 'credit';
    if (isDebit && isCredit) {
      const lower = body.toLowerCase();
      if (lower.includes('spent') || lower.includes('payment')) return 'debit';
      if (lower.includes('received') || lower.includes('credited')) return 'credit';
    }
    return null;
  }

  private static extractDate(body: string, bank: string): number | null {
    const pattern = DATE_PATTERNS[bank];
    if (!pattern) return null;

    const match = body.match(pattern);
    if (!match) return null;

    if (bank === 'Kuda' || bank === 'PalmPay') {
      return Date.now();
    }

    if (match[2] && MONTH_MAP[match[2]]) {
      const day = match[1].padStart(2, '0');
      const month = MONTH_MAP[match[2]];
      const year = match[3];
      const hour = match[4] ? match[4].padStart(2, '0') : '00';
      const min = match[5] ? match[5].padStart(2, '0') : '00';
      return new Date(`${year}-${month}-${day}T${hour}:${min}:00`).getTime();
    }

    if (match[2] && match[3]) {
      const day = match[1].padStart(2, '0');
      const month = match[2].padStart(2, '0');
      const year = match[3];
      return new Date(`${year}-${month}-${day}`).getTime();
    }

    return null;
  }

  private static extractMerchant(body: string, bank: string): string | null {
    const pattern = MERCHANT_PATTERNS[bank] || MERCHANT_PATTERNS.default;
    const match = body.match(pattern);
    if (!match) return null;

    return match[1]
      .replace(/^(?:Transfer from|Transfer to|From|To)\s+/i, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private static extractBalance(body: string, bank: string): number | null {
    const pattern = BALANCE_PATTERNS[bank] || BALANCE_PATTERNS.default;
    const match = body.match(pattern);
    return match ? parseFloat(match[1].replace(/,/g, '')) : null;
  }

  private static extractAccountInfo(body: string, bank: string) {
    const match = body.match(/Acct:\s*(\d{3}\*{4}\d{3}|\d{10})/i);
    if (match) {
      const full = match[1];
      const last4 = full.slice(-4);
      return { accountName: bank, last4 };
    }
    return { accountName: bank, last4: null };
  }

  private static extractEmailAmount(body: string): number | null {
    const match = body.match(/(?:NGN|₦|\$|£|USD|GBP)\s*([\d,]+\.\d{2})/i);
    return match ? parseFloat(match[1].replace(/,/g, '')) : null;
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
    const match = body.match(/(?:Dear|Hi|Hello)\s+(\w+)/i);
    return match ? match[1] : null;
  }

  private static extractEmailDate(body: string): number | null {
    const match = body.match(/(?:\bDate\b|\bTime\b):\s*([^\n\r]+)/i);
    if (match) {
      const parsed = Date.parse(match[1].trim());
      if (!isNaN(parsed)) return parsed;
    }
    return null;
  }
}
