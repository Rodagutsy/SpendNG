import { format } from 'date-fns';
import { formatCurrency } from './utils';
import { TransactionRecord } from './stores/transactionStore';
import { TaxComputationResult } from './tax-engine';
import { TaxProfileRecord, CapitalAssetRecord } from './stores/taxProfileStore';
import { WhtCredit } from './stores/taxStore';
import { File, Paths } from 'expo-file-system/next';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

interface CategoryGroup {
  name: string;
  total: number;
  count: number;
}

export type ExportFormat = 'PDF' | 'CSV';

export interface ExportOptions {
  format: ExportFormat;
  startDate: Date;
  endDate: Date;
  transactions: TransactionRecord[];
  userName: string;
  categoryNames?: Record<string, string>;
}

export interface TaxFilingPackOptions {
  taxYear: number;
  userName: string;
  profile: TaxProfileRecord;
  result: TaxComputationResult;
  transactions: TransactionRecord[];
  assets: CapitalAssetRecord[];
  whtCredits: WhtCredit[];
  categoryNames?: Record<string, string>;
}

export class ExportService {
  private static isPaused = false;
  private static abortController: AbortController | null = null;

  static setPaused(paused: boolean) {
    this.isPaused = paused;
  }

  static cancel() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  static async exportData(
    options: ExportOptions,
    onProgress: (progress: number) => void,
  ): Promise<string> {
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    onProgress(0);

    const timestamp = format(new Date(), 'yyyy-MM-dd_HHmmss');
    const ext = options.format.toLowerCase();
    const fileName = `SpendNG_Export_${timestamp}.${ext}`;
    const file = new File(Paths.cache, fileName);
    const filePath = file.uri;

    let fileUri: string;

    if (options.format === 'CSV') {
      fileUri = await this.generateCSV(options, filePath, signal, onProgress);
    } else {
      fileUri = await this.generatePDF(options, filePath, signal, onProgress);
    }

    this.abortController = null;
    onProgress(100);
    return fileUri;
  }

  private static escapeCSV(value: unknown): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  private static escapeHTML(value: unknown): string {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private static async generateCSV(
    options: ExportOptions,
    filePath: string,
    signal: AbortSignal,
    onProgress: (progress: number) => void,
  ): Promise<string> {
    const headers = [
      'Date', 'Amount (NGN)', 'Currency', 'Original Amount', 'Original Currency',
      'Exchange Rate', 'Type', 'Merchant', 'Category',
      'Account Name', 'Account (Last 4)', 'Available Balance', 'Source',
      'Notes', 'Flagged for Review',
    ];

    const lines = [headers.map(h => this.escapeCSV(h)).join(',')];
    const total = options.transactions.length;

    for (let i = 0; i < total; i++) {
      if (signal.aborted) throw new Error('Export cancelled');
      while (this.isPaused) {
        await new Promise(resolve => setTimeout(resolve, 200));
        if (signal.aborted) throw new Error('Export cancelled');
      }

      const t = options.transactions[i];
      const categoryName = options.categoryNames?.[t.categoryId] || t.categoryId;

      lines.push([
        this.escapeCSV(format(new Date(t.transactionDate), 'yyyy-MM-dd HH:mm:ss')),
        this.escapeCSV(t.amount),
        this.escapeCSV(t.currency),
        this.escapeCSV(t.originalAmount ?? ''),
        this.escapeCSV(t.originalCurrency ?? ''),
        this.escapeCSV(t.exchangeRate ?? ''),
        this.escapeCSV(t.transactionType),
        this.escapeCSV(t.merchantName),
        this.escapeCSV(categoryName),
        this.escapeCSV(t.accountName),
        this.escapeCSV(t.accountNumberLast4),
        this.escapeCSV(t.availableBalance),
        this.escapeCSV(t.sourceChannel),
        this.escapeCSV(t.notes),
        this.escapeCSV(t.isFlaggedForReview ? 'Yes' : 'No'),
      ].join(','));

      if (total > 1) {
        onProgress(Math.round((i / (total - 1)) * 90));
      }
    }

    onProgress(92);
    const fileToUse = new File(filePath);
    await fileToUse.write(lines.join('\n'));
    onProgress(98);
    return filePath;
  }

  private static aggregateByCategory(
    txns: TransactionRecord[],
    categoryNames?: Record<string, string>,
  ): CategoryGroup[] {
    const map = new Map<string, { total: number; count: number }>();
    for (const t of txns) {
      const cat = categoryNames?.[t.categoryId] || t.categoryId || 'Uncategorized';
      const existing = map.get(cat) || { total: 0, count: 0 };
      existing.total += t.amount;
      existing.count += 1;
      map.set(cat, existing);
    }
    return Array.from(map.entries())
      .map(([name, { total, count }]) => ({ name, total, count }))
      .sort((a, b) => b.total - a.total);
  }

  private static generatePDFHtml(options: ExportOptions): string {
    const { transactions, startDate, endDate, userName, categoryNames } = options;

    const incomeTxns = transactions.filter(t => t.transactionType === 'credit');
    const expenseTxns = transactions.filter(t => t.transactionType === 'debit');
    const totalIn = incomeTxns.reduce((s, t) => s + t.amount, 0);
    const totalOut = expenseTxns.reduce((s, t) => s + t.amount, 0);
    const net = totalIn - totalOut;

    const currency = transactions.length > 0 ? transactions[0].currency : 'NGN';

    const incomeByCat = this.aggregateByCategory(incomeTxns, categoryNames);
    const expenseByCat = this.aggregateByCategory(expenseTxns, categoryNames);

    const sortedTxns = [...transactions].sort((a, b) => a.transactionDate - b.transactionDate);

    const flaggedItems = transactions.filter(t => t.isFlaggedForReview);

    const receiptTxns = transactions.filter(t => t.receiptImageUri);

    const allSameCurrency = transactions.every(t => t.currency === currency);
    const foreignTxns = transactions.filter(t => t.originalCurrency && t.originalCurrency !== 'NGN');
    const hasForeignTxns = foreignTxns.length > 0;

    const esc = (v: unknown) => this.escapeHTML(v);

    const fmtDate = (ts: number) => format(new Date(ts), 'MMM dd, yyyy');
    const fmtDateTime = (ts: number) => format(new Date(ts), 'MMM dd, yyyy HH:mm');

    const fmtAmount = (amount: number) => formatCurrency(amount, currency);
    const fmtAmountOriginal = (amount: number) => {
      return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const metricsBlock = (label: string, value: string, color?: string) => `
      <tr>
        <td class="metric-label">${esc(label)}</td>
        <td class="metric-value"${color ? ` style="color:${color}"` : ''}>${value}</td>
      </tr>`;

    function typeRowTint(type: string): string {
      if (type === 'credit') return 'background-color:#f0fdf4;';  // subtle green
      if (type === 'debit') return 'background-color:#fef2f2;';   // subtle red
      return 'background-color:#f5f5f5;'; // grey for transfer
    }

    function typeLabel(type: string): string {
      if (type === 'credit') return 'Income';
      if (type === 'debit') return 'Expense';
      return 'Transfer';
    }

    function flagIcons(t: TransactionRecord): string {
      const flags: string[] = [];
      if (t.isFlaggedForReview) flags.push('[Review]');
      if (t.isDuplicate) flags.push('[Duplicate]');
      if (t.taxClassificationId) flags.push(`[${esc(t.taxClassificationId)}]`);
      return flags.length > 0 ? flags.join(' ') : '—';
    }

    const ledgerRows = sortedTxns.map(t => {
      const catName = categoryNames?.[t.categoryId] || t.categoryId || 'Uncategorized';
      const tint = typeRowTint(t.transactionType);
      const originalCol = t.originalCurrency && t.originalAmount
        ? `${esc(t.originalCurrency)} ${fmtAmountOriginal(t.originalAmount)}`
        : '—';
      return `<tr style="${tint}">
        <td class="cell">${fmtDate(t.transactionDate)}</td>
        <td class="cell">${esc(t.merchantName || t.originalMessage || '-')}</td>
        <td class="cell">${typeLabel(t.transactionType)}</td>
        <td class="cell">${esc(catName)}</td>
        <td class="cell amt">${fmtAmount(t.amount)}</td>
        <td class="cell">${originalCol}</td>
        <td class="cell">${esc(t.accountName || '-')}</td>
        <td class="cell flag-col">${flagIcons(t)}</td>
      </tr>`;
    }).join('');

    const incomeSummaryRows = incomeByCat.map(c => {
      const pct = totalIn > 0 ? ((c.total / totalIn) * 100).toFixed(1) : '0.0';
      return `<tr>
        <td class="cell">${esc(c.name)}</td>
        <td class="cell amt">${fmtAmount(c.total)}</td>
        <td class="cell amt">${pct}%</td>
      </tr>`;
    }).join('');

    const expenseSummaryRows = expenseByCat.map(c => {
      const pct = totalOut > 0 ? ((c.total / totalOut) * 100).toFixed(1) : '0.0';
      return `<tr>
        <td class="cell">${esc(c.name)}</td>
        <td class="cell amt">${fmtAmount(c.total)}</td>
        <td class="cell amt">${pct}%</td>
      </tr>`;
    }).join('');

    const flaggedRows = flaggedItems.map(t => {
      const reasons: string[] = [];
      if (t.isFlaggedForReview) reasons.push('Flagged for review');
      if (t.isDuplicate) reasons.push('Possible duplicate');
      if (!t.categoryId || t.categoryId === 'uncategorized') reasons.push('Needs classification');
      if (!t.taxClassificationId) reasons.push('Missing tax classification');
      const actions: string[] = [];
      if (t.isDuplicate) actions.push('Review & remove duplicate');
      else if (t.transactionType === 'debit' && t.amount > 50000) actions.push('Verify deductible eligibility');
      else actions.push('Confirm classification');
      return `<tr>
        <td class="cell">${fmtDate(t.transactionDate)} — ${esc(t.merchantName || '-')} (${fmtAmount(t.amount)})</td>
        <td class="cell">${esc(reasons.join('; '))}</td>
        <td class="cell">${esc(actions.join('; '))}</td>
      </tr>`;
    }).join('');

    const documentRows = receiptTxns.map(t => {
      const docType = t.receiptImageUri?.match(/\.(pdf|jpg|jpeg|png)$/i)?.[1]?.toUpperCase() || 'Receipt';
      return `<tr>
        <td class="cell">${esc(t.id)}</td>
        <td class="cell">${docType}</td>
        <td class="cell">Attached</td>
      </tr>`;
    }).join('');

    const dataSources = [...new Set(transactions.map(t => t.sourceChannel).filter(Boolean))];
    const bankAccounts = [...new Set(transactions.map(t => t.accountName).filter(Boolean))];
    const importMethod = dataSources.length > 0 ? dataSources.join(', ') : 'API Sync';
    const categorizationMethod = 'AI-assisted';

    const txCount = transactions.length;
    const reportTitle = 'Tax Review Report';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page {
      margin: 15mm;
      @bottom-center {
        content: "${esc(reportTitle)}";
        font-family: Helvetica, Arial, sans-serif;
        font-size: 8px;
        color: #9ca3af;
      }
      @bottom-right {
        content: "Page " counter(page);
        font-family: Helvetica, Arial, sans-serif;
        font-size: 8px;
        color: #9ca3af;
      }
    }
    * { box-sizing: border-box; }
    body {
      font-family: Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      color: #1f2937;
      font-size: 10px;
      line-height: 1.5;
    }
    .page-break { page-break-before: always; }
    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: #001133;
      margin: 0 0 4px 0;
      letter-spacing: -0.3px;
    }
    .section-sub {
      font-size: 10px;
      color: #6b7280;
      margin: 0 0 16px 0;
    }

    /* Cover page */
    .cover {
      text-align: center;
      padding-top: 60px;
    }
    .cover-title {
      font-size: 26px;
      font-weight: 700;
      color: #001133;
      letter-spacing: -0.5px;
      margin: 0 0 6px 0;
    }
    .cover-period {
      font-size: 13px;
      color: #6b7280;
      margin: 0 0 4px 0;
    }
    .cover-client {
      font-size: 12px;
      color: #374151;
      margin: 0 0 2px 0;
    }
    .cover-meta {
      font-size: 10px;
      color: #6b7280;
      margin: 0 0 24px 0;
    }
    .cover-divider {
      width: 60px;
      height: 2px;
      background: #001133;
      margin: 20px auto 24px auto;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th {
      background-color: #f3f4f6;
      padding: 6px 8px;
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      text-align: left;
      color: #6b7280;
      border-bottom: 1.5px solid #d1d5db;
    }
    th.amt { text-align: right; }
    td.cell {
      padding: 5px 8px;
      font-size: 9px;
      border-bottom: 1px solid #e5e7eb;
      vertical-align: top;
    }
    td.amt {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    td.flag-col { font-size: 8px; }
    .bold-row td {
      font-weight: 700;
      border-top: 1.5px solid #001133;
      border-bottom: 1.5px solid #001133;
    }

    /* Metrics table (compact) */
    .metrics-table { width: auto; margin: 0 auto; }
    .metrics-table td { padding: 4px 16px; border: none; font-size: 10px; }
    .metric-label { text-align: left; color: #6b7280; }
    .metric-value { text-align: right; font-weight: 700; }

    /* Data source block */
    .data-source {
      margin-top: 20px;
      padding: 10px 14px;
      background: #f9fafb;
      border-radius: 4px;
      font-size: 9px;
      color: #374151;
    }
    .data-source p { margin: 2px 0; }

    /* Disclaimer */
    .disclaimer {
      margin-top: 20px;
      padding: 10px 14px;
      background: #fef2f2;
      border: 1px solid #fca5a5;
      border-radius: 4px;
      font-size: 8px;
      color: #991b1b;
      line-height: 1.6;
    }
    .disclaimer strong { font-size: 9px; }
    .disclaimer p { margin: 3px 0; }

    /* Grid layout for metadata */
    .meta-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 4px 24px;
      margin-bottom: 16px;
    }
    .meta-item { width: calc(50% - 12px); }
    .meta-label { font-size: 8px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px; }
    .meta-value { font-size: 10px; font-weight: 600; color: #1f2937; }

    /* Color accents */
    .text-green { color: #16a34a; }
    .text-red { color: #dc2626; }
  </style>
</head>
<body>

  <!-- PAGE 1 - COVER / REPORT SUMMARY -->
  <div class="cover">
    <div class="cover-title">${esc(reportTitle)}</div>
    <div class="cover-period">${fmtDate(startDate.getTime())} – ${fmtDate(endDate.getTime())}</div>
    <div class="cover-client">${esc(userName)}</div>
    <div class="cover-meta">Currency: ${currency}${allSameCurrency ? '' : ' (mixed)'} &nbsp;|&nbsp; Prepared by SpendNG</div>
    <div class="cover-divider"></div>

    <table class="metrics-table">
      ${metricsBlock('Total Income', fmtAmount(totalIn), '#16a34a')}
      ${metricsBlock('Total Expenses', fmtAmount(totalOut), '#dc2626')}
      ${metricsBlock('Net Income', fmtAmount(net), net >= 0 ? '#16a34a' : '#dc2626')}
      ${metricsBlock('Number of Transactions', String(txCount))}
      ${metricsBlock('Number of Income Entries', String(incomeTxns.length))}
      ${metricsBlock('Number of Expense Entries', String(expenseTxns.length))}
    </table>

    ${hasForeignTxns ? `
    <div class="data-source" style="margin-top:12px;background:#eff6ff;border:1px solid #93c5fd;">
      <p><strong>Foreign Currency Transactions</strong></p>
      <p>${foreignTxns.length} transaction(s) in foreign currency converted at CBN/API rate.</p>
      <p>Exchange rates applied on transaction date. Original amounts preserved in ledger below.</p>
    </div>` : ''}

    <div class="data-source">
      <p><strong>Data Sources</strong></p>
      <p>Bank Accounts: ${bankAccounts.length > 0 ? bankAccounts.join(', ') : 'Not specified'}</p>
      <p>Cards: —</p>
      <p>Import Method: ${esc(importMethod)}</p>
    </div>
  </div>

  <!-- PAGE 2+ - TRANSACTION LEDGER -->
  <div class="page-break"></div>
  <div class="section-title">Transaction Ledger</div>
  <div class="section-sub">Chronological order • All transactions in ${currency}</div>

      <table>
    <thead>
      <tr>
        <th>Date</th><th>Description</th><th>Type</th><th>Category</th><th class="amt">Amount (NGN)</th><th>Original</th><th>Account</th><th>Flags</th>
      </tr>
    </thead>
    <tbody>
      ${ledgerRows || '<tr><td class="cell" colspan="8" style="text-align:center;color:#9ca3af;">No transactions found</td></tr>'}
    </tbody>
  </table>

  <!-- INCOME SUMMARY -->
  <div class="page-break"></div>
  <div class="section-title">Income Breakdown</div>
  <div class="section-sub">Aggregated by source type</div>

  <table>
    <thead>
      <tr><th>Source Type</th><th class="amt">Amount</th><th class="amt">Percentage</th></tr>
    </thead>
    <tbody>
      ${incomeSummaryRows || '<tr><td class="cell" colspan="3" style="text-align:center;color:#9ca3af;">No income entries</td></tr>'}
      <tr class="bold-row">
        <td class="cell">Total Income</td>
        <td class="cell amt text-green">${fmtAmount(totalIn)}</td>
        <td class="cell amt">100%</td>
      </tr>
    </tbody>
  </table>

  <!-- EXPENSE SUMMARY -->
  <div class="section-title" style="margin-top:24px;">Expense Breakdown</div>
  <div class="section-sub">Aggregated by category</div>

  <table>
    <thead>
      <tr><th>Category</th><th class="amt">Amount</th><th class="amt">Percentage</th></tr>
    </thead>
    <tbody>
      ${expenseSummaryRows || '<tr><td class="cell" colspan="3" style="text-align:center;color:#9ca3af;">No expense entries</td></tr>'}
      <tr class="bold-row">
        <td class="cell">Total Expenses</td>
        <td class="cell amt text-red">${fmtAmount(totalOut)}</td>
        <td class="cell amt">100%</td>
      </tr>
    </tbody>
  </table>

  <!-- TAX FLAGS & REVIEW NOTES -->
  ${flaggedItems.length > 0 ? `
  <div class="page-break"></div>
  <div class="section-title">Items Requiring Review</div>
  <div class="section-sub">Transactions flagged for accountant attention</div>
  <table>
    <thead>
      <tr><th>Transaction</th><th>Reason Flagged</th><th>Suggested Action</th></tr>
    </thead>
    <tbody>
      ${flaggedRows}
    </tbody>
  </table>` : ''}

  <!-- SUPPORTING DOCUMENT INDEX -->
  ${receiptTxns.length > 0 ? `
  <div class="page-break"></div>
  <div class="section-title">Receipts &amp; Documents</div>
  <div class="section-sub">Supporting documents attached to transactions</div>
  <table>
    <thead>
      <tr><th>Transaction ID</th><th>Document Type</th><th>File Name / Link</th></tr>
    </thead>
    <tbody>
      ${documentRows}
    </tbody>
  </table>` : ''}

  <!-- FINAL PAGE - METADATA & DECLARATION -->
  <div class="page-break"></div>
  <div class="section-title">Report Metadata</div>
  <div class="section-sub">Report generation details</div>

  <div class="meta-grid">
    <div class="meta-item">
      <div class="meta-label">Total Transactions Processed</div>
      <div class="meta-value">${txCount}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Date Range Coverage</div>
      <div class="meta-value">${fmtDate(startDate.getTime())} – ${fmtDate(endDate.getTime())}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Data Sources Used</div>
      <div class="meta-value">${esc(dataSources.join(', ') || 'API Sync')}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Last Updated</div>
      <div class="meta-value">${fmtDateTime(Date.now())}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Categorization Method</div>
      <div class="meta-value">${categorizationMethod}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Confidence Indicator</div>
      <div class="meta-value">High</div>
    </div>
  </div>

  <div class="disclaimer">
    <strong>Disclaimer</strong>
    <p>This report is for tax preparation assistance only. It is generated based on transaction data synced from linked accounts and does not constitute professional tax advice.</p>
    <p>Final tax classification must be confirmed by a licensed accountant or tax authority guidelines. Tax liability may vary based on applicable local laws, deductions, and exemptions.</p>
    <p>No tax filing is performed automatically. This document serves as a working summary for your accountant or for your own record-keeping.</p>
  </div>

</body>
</html>`;
  }

  private static async generatePDF(
    options: ExportOptions,
    filePath: string,
    signal: AbortSignal,
    onProgress: (progress: number) => void,
  ): Promise<string> {
    if (signal.aborted) throw new Error('Export cancelled');

    onProgress(20);

    const html = this.generatePDFHtml(options);

    onProgress(50);
    const { uri } = await Print.printToFileAsync({ html });
    onProgress(90);
    const sourceFile = new File(uri);
    await sourceFile.move(new File(filePath));
    onProgress(98);
    return filePath;
  }

  static async generateTaxFilingPackPDF(options: TaxFilingPackOptions): Promise<string> {
    const html = this.generateTaxFilingPackHtml(options);
    const { uri } = await Print.printToFileAsync({ html });
    const filename = `SpendNG_Tax_Filing_Pack_YA${options.taxYear}_${Date.now()}.pdf`;
    const filePath = `${Paths.cache.uri}/${filename}`;
    const sourceFile = new File(uri);
    await sourceFile.move(new File(filePath));
    return filePath;
  }

  private static generateTaxFilingPackHtml(options: TaxFilingPackOptions): string {
    const { taxYear, userName, profile, result, transactions, assets, whtCredits } = options;
    const esc = (v: unknown) => this.escapeHTML(v);
    const fmt = (n: number) => `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const fmtDate = (ts: number) => format(new Date(ts), 'MMM dd, yyyy');

    const yearTxns = transactions.filter(
      (t) => !t.isDuplicate && new Date(t.transactionDate).getFullYear() === taxYear
    );
    const foreignTxns = yearTxns.filter(
      (t) => t.transactionType === 'credit' && t.originalCurrency && t.originalCurrency !== 'NGN'
    );
    const excludedTxns = yearTxns.filter(
      (t) =>
        t.transactionType === 'credit' &&
        (t.taxClassificationId === 'non-taxable' ||
          t.taxClassificationId === 'self-transfer' ||
          t.taxClassificationId === 'loan-received' ||
          t.taxClassificationId === 'capital-injection' ||
          t.taxClassificationId === 'final-wht-interest')
    );

    const bandRows = result.bandBreakdown
      .map(
        (b) => `<tr>
          <td>${esc(b.label)}</td>
          <td class="amt">${(b.rate * 100).toFixed(0)}%</td>
          <td class="amt">${fmt(b.taxableInBand)}</td>
          <td class="amt">${fmt(b.taxInBand)}</td>
        </tr>`
      )
      .join('');

    const fxRows =
      foreignTxns.length === 0
        ? `<tr><td colspan="5" class="muted">No foreign currency inflows recorded for ${taxYear}.</td></tr>`
        : foreignTxns
            .map(
              (t) => `<tr>
                <td>${fmtDate(t.transactionDate)}</td>
                <td>${esc(t.merchantName || '-')}</td>
                <td>${esc(t.originalCurrency)} ${(t.originalAmount ?? 0).toLocaleString()}</td>
                <td class="amt">${t.exchangeRate ? t.exchangeRate.toFixed(2) : '—'}</td>
                <td class="amt">${fmt(t.amount)}</td>
              </tr>`
            )
            .join('');

    const caRows =
      result.capitalAllowanceSchedule.length === 0
        ? `<tr><td colspan="5" class="muted">No qualifying capital assets recorded for ${taxYear}.</td></tr>`
        : result.capitalAllowanceSchedule
            .map((ca) => {
              const asset = assets.find((a) => a.id === ca.assetId);
              return `<tr>
                <td>${esc(ca.name)}</td>
                <td>${esc(ca.assetClass.replace('_', ' '))}</td>
                <td class="amt">${fmt(ca.qualifyingCost)}</td>
                <td class="amt">${(ca.rate * 100).toFixed(0)}%</td>
                <td class="amt">${fmt(ca.allowanceClaimed)}${asset?.vatPaid === false ? ' (Disallowed: No VAT)' : ''}</td>
              </tr>`;
            })
            .join('');

    const excludedRows =
      excludedTxns.length === 0
        ? `<tr><td colspan="4" class="muted">No excluded non-taxable inflows recorded.</td></tr>`
        : excludedTxns
            .map(
              (t) => `<tr>
                <td>${fmtDate(t.transactionDate)}</td>
                <td>${esc(t.merchantName || '-')}</td>
                <td>${esc(t.taxClassificationId)}</td>
                <td class="amt">${fmt(t.amount)}</td>
              </tr>`
            )
            .join('');

    const whtRows =
      whtCredits.length === 0
        ? `<tr><td colspan="5" class="muted">No manual WHT credit notes added.</td></tr>`
        : whtCredits
            .map(
              (w) => `<tr>
                <td>${esc(w.clientName)}</td>
                <td>${esc(w.payerTin || '—')}</td>
                <td>${esc(w.creditNoteRef || '—')}</td>
                <td class="amt">${fmt(w.grossAmount)}</td>
                <td class="amt">${fmt(w.whtAmount)}</td>
              </tr>`
            )
            .join('');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { margin: 14mm; }
    body { font-family: Helvetica, Arial, sans-serif; color: #1f2937; font-size: 10px; line-height: 1.45; }
    h1 { font-size: 20px; color: #001133; margin: 0 0 4px 0; }
    h2 { font-size: 13px; color: #0B5CFF; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin: 18px 0 8px 0; }
    .meta { color: #6b7280; font-size: 10px; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    th, td { border-bottom: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; }
    th { background: #f8fafc; font-weight: 700; color: #374151; }
    .amt { text-align: right; font-variant-numeric: tabular-nums; }
    .bold { font-weight: 700; }
    .muted { color: #6b7280; text-align: center; }
    .hero { background: #f0f5ff; border: 1px solid #c7d7fe; border-radius: 6px; padding: 12px; margin-bottom: 14px; }
    .disclaimer { background: #fefce8; border: 1px solid #fde68a; border-radius: 6px; padding: 10px; font-size: 9px; color: #78350f; margin-top: 16px; }
  </style>
</head>
<body>
  <h1>Personal Income Tax Filing Pack — YA ${taxYear}</h1>
  <div class="meta">
    Regime: <strong>${result.regime === 'NTA_2025' ? 'Nigeria Tax Act 2025' : 'Legacy PITA'}</strong> |
    Generated: ${format(new Date(), 'MMM dd, yyyy')} |
    Prepared for: <strong>${esc(userName)}</strong>
  </div>

  <h2>1. Taxpayer Profile & Self-Assessment Attestation (NTAA s. 13)</h2>
  <table>
    <tr><td>Taxpayer Name</td><td class="bold">${esc(userName)}</td><td>State of Residence</td><td class="bold">${esc(profile.stateOfResidence)}</td></tr>
    <tr><td>Tax ID / NIN</td><td>${esc(profile.taxId || 'Not provided')}</td><td>Income Streams</td><td>${esc(profile.incomeStreams.join(', '))}</td></tr>
    <tr><td>Filing Deadline</td><td>31 March ${taxYear + 1}</td><td>Late Filing Penalty</td><td>₦100,000 + ₦50,000/month</td></tr>
  </table>

  <div class="hero">
    <strong>Summary Result:</strong>
    ${result.taxRefundable > 0 ? `Estimated Tax Refundable: <strong>${fmt(result.taxRefundable)}</strong>` : `Estimated Net Tax Payable: <strong>${fmt(result.netTaxPayable)}</strong>`}
    | Effective Tax Rate: <strong>${(result.effectiveTaxRate * 100).toFixed(2)}%</strong>
    ${result.minimumWageExempt ? ' | <em>Minimum Wage Exempt</em>' : ''}
    ${result.minimumTaxApplied ? ' | <em>1% Minimum Tax Applied</em>' : ''}
  </div>

  <h2>2. Statutory Tax Computation Waterfall</h2>
  <table>
    <tr><th>Description</th><th class="amt">Amount (NGN)</th></tr>
    <tr><td>Gross Reportable Income</td><td class="amt">${fmt(result.grossReportableIncome)}</td></tr>
    <tr><td>Less: Allowable Business Expenses</td><td class="amt">(${fmt(result.allowableBusinessExpenses)})</td></tr>
    <tr><td>Less: Capital Allowances (Table I)</td><td class="amt">(${fmt(result.capitalAllowancesTotal)})</td></tr>
    <tr class="bold"><td>Net Business Profit</td><td class="amt">${fmt(result.netBusinessProfit)}</td></tr>
    <tr class="bold"><td>Total Income (All Streams)</td><td class="amt">${fmt(result.totalIncome)}</td></tr>
    <tr><td>Less: Eligible Reliefs & Deductions (Rent Relief/CRA, Pension, NHF, NHIS, Life Assurance)</td><td class="amt">(${fmt(result.eligibleDeductions.total)})</td></tr>
    <tr class="bold"><td>Chargeable Income</td><td class="amt">${fmt(result.chargeableIncome)}</td></tr>
    <tr><td>Gross Tax Liability</td><td class="amt">${fmt(result.grossTaxLiability)}</td></tr>
    <tr><td>Less: PAYE Deducted</td><td class="amt">(${fmt(result.credits.payeDeducted)})</td></tr>
    <tr><td>Less: WHT Credits</td><td class="amt">(${fmt(result.credits.whtCredits)})</td></tr>
    <tr><td>Less: Unilateral Foreign Tax Credit (s. 120)</td><td class="amt">(${fmt(result.credits.foreignTaxCredit)})</td></tr>
    <tr class="bold"><td>${result.taxRefundable > 0 ? 'Net Tax Refundable' : 'Net Tax Payable'}</td><td class="amt">${fmt(result.taxRefundable > 0 ? result.taxRefundable : result.netTaxPayable)}</td></tr>
  </table>

  <table>
    <tr><th>Tax Band</th><th class="amt">Rate</th><th class="amt">Taxable in Band</th><th class="amt">Tax</th></tr>
    ${bandRows || '<tr><td colspan="4" class="muted">Zero chargeable income.</td></tr>'}
  </table>

  <h2>3. Statement of Accounts (P&amp;L) &amp; WHT Credit Notes</h2>
  <table>
    <tr><th>Category</th><th class="amt">Amount (NGN)</th></tr>
    <tr><td>Employment / PAYE Income</td><td class="amt">${fmt(result.employmentIncome)}</td></tr>
    <tr><td>Business / Freelance / Creator Gross Income</td><td class="amt">${fmt(result.businessGrossIncome)}</td></tr>
    <tr><td>Rental Income</td><td class="amt">${fmt(result.rentalIncome)}</td></tr>
    <tr><td>Investment / Other Taxable Income</td><td class="amt">${fmt(result.investmentIncome + result.otherTaxableIncome)}</td></tr>
    <tr><td>Digital Asset Net Gain (Ring-Fenced s. 28(3)(iv))</td><td class="amt">${fmt(result.digitalAssetNetGain)}</td></tr>
    <tr><td>Disallowed Expenses (Missing VAT / Duty s. 21(p))</td><td class="amt">${fmt(result.disallowedVatExpenseTotal)}</td></tr>
  </table>
  <table>
    <tr><th>Client / Payer</th><th>Payer TIN</th><th>Credit Note Ref</th><th class="amt">Gross</th><th class="amt">WHT</th></tr>
    ${whtRows}
  </table>

  <h2>4. Foreign Currency (FX) Schedule (NTAA s. 39)</h2>
  <table>
    <tr><th>Date</th><th>Payer / Source</th><th>Original Amount</th><th class="amt">FX Rate</th><th class="amt">NGN Equivalent</th></tr>
    ${fxRows}
  </table>

  <h2>5. Capital Allowance Schedule (NTA 2025 Table I)</h2>
  <table>
    <tr><th>Asset</th><th>Class</th><th class="amt">Cost (NGN)</th><th class="amt">Rate</th><th class="amt">Allowance</th></tr>
    ${caRows}
  </table>

  <h2>6. Excluded Non-Taxable Inflows Reconciliation</h2>
  <table>
    <tr><th>Reconciliation</th><th class="amt">Amount (NGN)</th></tr>
    <tr><td>Total Bank Credits</td><td class="amt">${fmt(result.totalBankCredits)}</td></tr>
    <tr><td>Less: Excluded Non-Taxable Inflows &amp; Final WHT Interest</td><td class="amt">(${fmt(result.excludedNonTaxableTotal + result.excludedFinalWhtInterestTotal)})</td></tr>
    <tr class="bold"><td>Gross Reportable Income</td><td class="amt">${fmt(result.grossReportableIncome)}</td></tr>
  </table>
  <table>
    <tr><th>Date</th><th>Source</th><th>Classification</th><th class="amt">Amount (NGN)</th></tr>
    ${excludedRows}
  </table>

  <div class="disclaimer">
    <strong>Disclaimer:</strong> This Filing Pack is prepared for personal self-assessment preparation and review with a licensed tax professional or relevant State Internal Revenue Service (e.g. LIRS/FIRS). It does not constitute formal tax advice or legal representation, and SpendNG does not submit filings automatically.
  </div>
</body>
</html>`;
  }

  static async shareFile(path: string): Promise<void> {
    if (await Sharing.isAvailableAsync()) {
      const mimeType = path.endsWith('.csv') ? 'text/csv' : 'application/pdf';
      await Sharing.shareAsync(path, { mimeType, dialogTitle: 'Share SpendNG Export' });
    } else {
      throw new Error('Sharing is not available on this device');
    }
  }
}
