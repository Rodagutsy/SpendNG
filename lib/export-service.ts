import { format } from 'date-fns';
import { formatCurrency } from './utils';
import { TransactionRecord } from './stores/transactionStore';
import { File, Paths } from 'expo-file-system/next';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

export type ExportFormat = 'PDF' | 'CSV';

export interface ExportOptions {
  format: ExportFormat;
  startDate: Date;
  endDate: Date;
  transactions: TransactionRecord[];
  userName: string;
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
      'Date', 'Amount', 'Currency', 'Type', 'Merchant', 'Category',
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

  private static async generatePDF(
    options: ExportOptions,
    filePath: string,
    signal: AbortSignal,
    onProgress: (progress: number) => void,
  ): Promise<string> {
    if (signal.aborted) throw new Error('Export cancelled');

    const totalIn = options.transactions
      .filter(t => t.transactionType === 'credit')
      .reduce((s, t) => s + t.amount, 0);
    const totalOut = options.transactions
      .filter(t => t.transactionType === 'debit')
      .reduce((s, t) => s + t.amount, 0);
    const net = totalIn - totalOut;

    onProgress(10);

    const rows = options.transactions.map(t => {
      const categoryName = options.categoryNames?.[t.categoryId] || t.categoryId;
      const date = format(new Date(t.transactionDate), 'MMM dd, yyyy HH:mm');
      const amount = formatCurrency(t.amount, t.currency);
      const typeColor = t.transactionType === 'credit' ? '#16a34a' : '#dc2626';
      const typeLabel = t.transactionType === 'credit' ? 'Credit' : 'Debit';
      const merchant = t.merchantName ? this.escapeHTML(t.merchantName) : '-';
      return `<tr>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-size:12px;">${date}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-size:12px;text-align:right;">${amount}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-size:12px;color:${typeColor};">${typeLabel}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-size:12px;">${merchant}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-size:12px;">${this.escapeHTML(categoryName)}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-size:12px;">${t.sourceChannel}</td>
      </tr>`;
    }).join('\n');

    onProgress(40);

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page { margin: 20px; }
    body { font-family: -apple-system, Helvetica, Arial, sans-serif; margin: 0; padding: 20px; color: #1f2937; }
    .header { text-align: center; margin-bottom: 24px; }
    .header h1 { font-size: 24px; margin: 0; color: #001133; letter-spacing: -0.5px; }
    .header p { font-size: 12px; color: #6b7280; margin: 4px 0; }
    .summary { display: flex; justify-content: center; gap: 40px; margin-bottom: 24px; }
    .summary-item { text-align: center; }
    .summary-label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .summary-value { font-size: 18px; font-weight: 700; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { background-color: #f3f4f6; padding: 10px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; color: #6b7280; border-bottom: 2px solid #e5e7eb; }
    th.amount { text-align: right; }
    td { padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
    .footer { text-align: center; margin-top: 24px; font-size: 10px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="header">
    <h1>SpendNG</h1>
    <p>Transaction Report</p>
    <p>${this.escapeHTML(options.userName)} &mdash; ${format(options.startDate, 'MMM dd, yyyy')} to ${format(options.endDate, 'MMM dd, yyyy')}</p>
  </div>
  <div class="summary">
    <div class="summary-item">
      <div class="summary-label">Total Income</div>
      <div class="summary-value" style="color:#16a34a">${formatCurrency(totalIn, 'NGN')}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Total Expenses</div>
      <div class="summary-value" style="color:#dc2626">${formatCurrency(totalOut, 'NGN')}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Net</div>
      <div class="summary-value" style="color:${net >= 0 ? '#16a34a' : '#dc2626'}">${formatCurrency(net, 'NGN')}</div>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Date</th><th class="amount">Amount</th><th>Type</th><th>Merchant</th><th>Category</th><th>Source</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
  <div class="footer">
    Generated by SpendNG on ${format(new Date(), 'MMMM dd, yyyy HH:mm')} &mdash; ${options.transactions.length} transaction(s)
  </div>
</body>
</html>`;

    onProgress(50);
    const { uri } = await Print.printToFileAsync({ html });
    onProgress(90);
    const sourceFile = new File(uri);
    await sourceFile.move(new File(filePath));
    onProgress(98);
    return filePath;
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
