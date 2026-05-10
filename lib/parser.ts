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

export class Parser {
  static parseSMS(body: string, sender: string, timestamp: number): ParsedTransaction | null {
    // 1. Identify Bank
    const bank = this.identifyBank(sender);
    if (!bank) return null;

    // 2. Extract Amount
    const amount = this.extractAmount(body, bank);
    if (amount === null) return null;

    // 3. Extract Type
    const type = this.extractType(body, bank);
    if (!type) return null;

    // 4. Extract Date
    const date = this.extractDate(body, bank) || timestamp;

    // 5. Extract Merchant
    const merchant = this.extractMerchant(body, bank);

    // 6. Extract Balance
    const balance = this.extractBalance(body, bank);

    // 7. Extract Account Info
    const { accountName, last4 } = this.extractAccountInfo(body, bank);

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
      parseConfidence: merchant && balance ? 'high' : 'medium',
    };
  }

  private static identifyBank(sender: string): string | null {
    const s = sender.toUpperCase();
    if (s.includes('GTB')) return 'GTBank';
    if (s.includes('ACCESS')) return 'Access Bank';
    if (s.includes('ZENITH')) return 'Zenith Bank';
    if (s.includes('FIRSTBANK') || s.includes('FBN')) return 'FirstBank';
    if (s.includes('UBA')) return 'UBA';
    if (s.includes('KUDA')) return 'Kuda';
    if (s.includes('OPAY')) return 'OPay';
    if (s.includes('MONIEPOINT')) return 'Moniepoint';
    if (s.includes('PALMPAY')) return 'PalmPay';
    return null;
  }

  private static extractAmount(body: string, bank: string): number | null {
    const patterns: Record<string, RegExp> = {
      'GTBank': /(?:Amt|Amount):\s*NGN\s*([\d,]+\.\d{2})/i,
      'Access Bank': /Amt:\s*NGN\s*([\d,]+\.\d{2})/i,
      'Zenith Bank': /(?:CR|DR):\s*NGN\s*([\d,]+\.\d{2})/i,
      'Kuda': /(?:spent|received)\s*NGN\s*([\d,]+\.\d{2})/i,
      'default': /(?:NGN|₦)?\s*([\d,]+\.\d{2})/i
    };

    const match = body.match(patterns[bank] || patterns.default);
    if (match) {
      return parseFloat(match[1].replace(/,/g, ''));
    }
    return null;
  }

  private static extractType(body: string, bank: string): 'credit' | 'debit' | null {
    const creditTerms = ['credit', 'credited', 'received', 'deposit', 'inflow', 'cr'];
    const debitTerms = ['debit', 'debited', 'spent', 'payment', 'withdrawal', 'dr'];

    const lowerBody = body.toLowerCase();
    if (debitTerms.some(term => lowerBody.includes(term))) return 'debit';
    if (creditTerms.some(term => lowerBody.includes(term))) return 'credit';
    
    return null;
  }

  private static extractDate(body: string, bank: string): number | null {
    // Simplified date extraction for demo
    // Real implementation would use the regex from regex-library.md
    const dateMatch = body.match(/Date:\s*(\d{2})-([A-Za-z]{3})-(\d{4})/i);
    if (dateMatch) {
      const [_, day, mon, year] = dateMatch;
      const month = MONTH_MAP[mon] || '01';
      return new Date(`${year}-${month}-${day}`).getTime();
    }
    return null;
  }

  private static extractMerchant(body: string, bank: string): string | null {
    const match = body.match(/(?:Desc|Narration|From|Sender|Merchant):\s*(.+?)(?:\n|$)/i);
    return match ? match[1].trim() : null;
  }

  private static extractBalance(body: string, bank: string): number | null {
    const match = body.match(/(?:Bal|Balance):\s*NGN\s*([\d,]+\.\d{2})/i);
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
}
