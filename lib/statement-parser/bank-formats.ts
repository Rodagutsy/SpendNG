export interface BankFormat {
  name: string;
  keywords: string[];
  dateFormat: 'DD/MM/YYYY' | 'DD-MMM-YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  dateGroups: { day: number; month: number; year: number };
  amountInflowHeaders: string[];
  amountOutflowHeaders: string[];
  descriptionHeaders: string[];
  balanceHeaders: string[];
  skipRows: number;
  headerRow: number;
  type: 'csv' | 'pdf';
}

const NIGERIAN_BANK_FORMATS: BankFormat[] = [
  {
    name: 'GTBank',
    keywords: ['gtbank', 'gtb', 'guaranty'],
    dateFormat: 'DD/MM/YYYY',
    dateGroups: { day: 0, month: 1, year: 2 },
    amountInflowHeaders: ['credit', 'inflow', 'deposit'],
    amountOutflowHeaders: ['debit', 'outflow', 'withdrawal'],
    descriptionHeaders: ['description', 'narrative', 'details', 'transaction details', 'remark'],
    balanceHeaders: ['balance', 'available balance', 'running balance'],
    skipRows: 0,
    headerRow: 0,
    type: 'csv',
  },
  {
    name: 'FirstBank',
    keywords: ['first bank', 'firstbank', 'fbn'],
    dateFormat: 'DD/MM/YYYY',
    dateGroups: { day: 0, month: 1, year: 2 },
    amountInflowHeaders: ['credit', 'inflow', 'deposit'],
    amountOutflowHeaders: ['debit', 'outflow', 'withdrawal'],
    descriptionHeaders: ['description', 'narrative', 'remarks', 'transaction details'],
    balanceHeaders: ['balance', 'available balance', 'running balance'],
    skipRows: 0,
    headerRow: 0,
    type: 'csv',
  },
  {
    name: 'Access Bank',
    keywords: ['access bank', 'accessbank'],
    dateFormat: 'DD/MM/YYYY',
    dateGroups: { day: 0, month: 1, year: 2 },
    amountInflowHeaders: ['credit', 'inflow'],
    amountOutflowHeaders: ['debit', 'outflow'],
    descriptionHeaders: ['description', 'narrative', 'remark', 'transaction remark'],
    balanceHeaders: ['balance', 'available balance', 'running bal'],
    skipRows: 0,
    headerRow: 0,
    type: 'csv',
  },
  {
    name: 'Zenith Bank',
    keywords: ['zenith'],
    dateFormat: 'DD/MM/YYYY',
    dateGroups: { day: 0, month: 1, year: 2 },
    amountInflowHeaders: ['credit', 'inflow'],
    amountOutflowHeaders: ['debit', 'outflow'],
    descriptionHeaders: ['description', 'narrative', 'particulars', 'transaction details'],
    balanceHeaders: ['balance', 'available balance'],
    skipRows: 0,
    headerRow: 0,
    type: 'csv',
  },
  {
    name: 'UBA',
    keywords: ['uba', 'united bank'],
    dateFormat: 'DD/MM/YYYY',
    dateGroups: { day: 0, month: 1, year: 2 },
    amountInflowHeaders: ['credit', 'inflow', 'deposit'],
    amountOutflowHeaders: ['debit', 'outflow', 'withdrawal'],
    descriptionHeaders: ['description', 'narrative', 'details', 'remark'],
    balanceHeaders: ['value date', 'balance', 'available balance'],
    skipRows: 0,
    headerRow: 0,
    type: 'csv',
  },
  {
    name: 'FCMB',
    keywords: ['fcmb', 'first city'],
    dateFormat: 'DD/MM/YYYY',
    dateGroups: { day: 0, month: 1, year: 2 },
    amountInflowHeaders: ['credit', 'inflow'],
    amountOutflowHeaders: ['debit', 'outflow'],
    descriptionHeaders: ['description', 'narrative', 'transaction details', 'particulars'],
    balanceHeaders: ['balance', 'available balance', 'running bal'],
    skipRows: 0,
    headerRow: 0,
    type: 'csv',
  },
  {
    name: 'Fidelity Bank',
    keywords: ['fidelity'],
    dateFormat: 'DD/MM/YYYY',
    dateGroups: { day: 0, month: 1, year: 2 },
    amountInflowHeaders: ['credit', 'inflow'],
    amountOutflowHeaders: ['debit', 'outflow'],
    descriptionHeaders: ['description', 'narrative', 'particulars'],
    balanceHeaders: ['balance', 'available balance'],
    skipRows: 0,
    headerRow: 0,
    type: 'csv',
  },
];

export function detectBankFormat(headers: string[], sampleRows: string[][]): BankFormat | null {
  const headerKeywords = headers.join(' ').toLowerCase();

  for (const fmt of NIGERIAN_BANK_FORMATS) {
    if (fmt.keywords.some((kw) => headerKeywords.includes(kw))) {
      return fmt;
    }
  }

  for (const fmt of NIGERIAN_BANK_FORMATS) {
    const hasInflow = fmt.amountInflowHeaders.some((h) =>
      headers.some((header) => header.toLowerCase().includes(h))
    );
    const hasOutflow = fmt.amountOutflowHeaders.some((h) =>
      headers.some((header) => header.toLowerCase().includes(h))
    );
    const hasDesc = fmt.descriptionHeaders.some((h) =>
      headers.some((header) => header.toLowerCase().includes(h))
    );
    if ((hasInflow || hasOutflow) && hasDesc) {
      return fmt;
    }
  }

  return null;
}

export { NIGERIAN_BANK_FORMATS };
