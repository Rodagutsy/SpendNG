export type TransactionType = 'credit' | 'debit';

const DEBIT_KEYWORDS = [
  'debit', 'debited', 'dr', 'spent', 'withdrawal', 'withdraw',
  'payment', 'purchase', 'paid', 'deducted', 'charges', 'fee',
  'stamp duty', 'service charge',
];

const CREDIT_KEYWORDS = [
  'credit', 'credited', 'cr', 'received', 'deposit', 'inflow',
  'refund', 'reversal', 'chargeback', 'reversed', 'storno',
  'salary', 'reversal/refund',
];

export function normalizeType(raw: string): TransactionType | null {
  const lower = raw.toLowerCase().trim();
  let isDebit = false;
  let isCredit = false;

  for (const kw of DEBIT_KEYWORDS) {
    if (lower.includes(kw)) { isDebit = true; break; }
  }
  for (const kw of CREDIT_KEYWORDS) {
    if (lower.includes(kw)) { isCredit = true; break; }
  }

  if (isDebit && !isCredit) return 'debit';
  if (isCredit && !isDebit) return 'credit';
  if (isDebit && isCredit) {
    if (lower.includes('spent') || lower.includes('payment')) return 'debit';
    if (lower.includes('received') || lower.includes('credited')) return 'credit';
  }
  return null;
}

const REVERSAL_KEYWORDS = /reversal|refund|chargeback|reversed|storno|returned|reversal\/refund/i;

export function isReversal(raw: string): boolean {
  return REVERSAL_KEYWORDS.test(raw);
}

const FEE_KEYWORDS = /charges?|fee|vat|stamp duty|sms charge|service charge|commission|maintenance fee|cot|vat on charge/i;

export function isFee(raw: string): boolean {
  return FEE_KEYWORDS.test(raw);
}

const LOAN_KEYWORDS = /loan\s*(?:disbursement|repayment|deduction)|borrowing|direct loan|loan repayment|loan deduction/i;

export function isLoanRelated(raw: string): boolean {
  return LOAN_KEYWORDS.test(raw);
}
