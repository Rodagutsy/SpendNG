import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';
import { Transaction } from '../model/models';
import { formatCurrency } from './utils';

export type ExportFormat = 'PDF' | 'CSV';

export interface ExportOptions {
  format: ExportFormat;
  startDate: Date;
  endDate: Date;
  transactions: Transaction[];
  userName: string;
}

export class ExportService {
  private static readonly FILE_PREFIX = 'SpendNG_Export_';
  private static isPaused = false;
  private static pausePromise: Promise<void> | null = null;
  private static pauseResolver: (() => void) | null = null;

  static setPaused(paused: boolean) {
    this.isPaused = paused;
    if (!paused && this.pauseResolver) {
      this.pauseResolver();
      this.pausePromise = null;
      this.pauseResolver = null;
    }
  }

  private static async checkPause() {
    if (this.isPaused) {
      if (!this.pausePromise) {
        this.pausePromise = new Promise(resolve => {
          this.pauseResolver = resolve;
        });
      }
      await this.pausePromise;
    }
  }

  /**
   * Main entry point for export generation
   */
  static async exportData(options: ExportOptions, onProgress: (progress: number) => void): Promise<string> {
    const { format: exportFormat, startDate, endDate, transactions } = options;

    if (transactions.length === 0) {
      throw new Error('No transactions found for this period.');
    }

    // 1. Check storage
    await this.validateStorage(transactions.length);

    // 2. Generate filename
    const fileName = `${this.FILE_PREFIX}${format(startDate, 'yyyy-MM-dd')}_to_${format(endDate, 'yyyy-MM-dd')}.${exportFormat.toLowerCase()}`;
    const filePath = `${FileSystem.cacheDirectory}${fileName}`;

    // 3. Generate file based on format
    if (exportFormat === 'CSV') {
      await this.generateCSV(transactions, filePath, onProgress);
    } else {
      await this.generatePDF(options, filePath, onProgress);
    }

    return filePath;
  }

  /**
   * Estimate file size and check if enough space exists
   */
  private static async validateStorage(recordCount: number): Promise<void> {
    const info = await FileSystem.getFreeDiskStorageAsync();
    // Conservative estimate: 500 bytes per transaction in CSV, 2KB in PDF
    const estimatedSize = recordCount * 2048; 

    if (info < estimatedSize) {
      throw new Error('Not enough space to create this file.');
    }
  }

  /**
   * CSV Generation logic
   */
  private static async generateCSV(transactions: Transaction[], path: string, onProgress: (p: number) => void): Promise<void> {
    // Headers: Date,Type,Merchant,Category,Currency,Amount,Balance,Source
    const headers = 'Date,Type,Merchant,Category,Currency,Amount,Balance,Source\n';
    let csvContent = headers;

    const total = transactions.length;
    for (let i = 0; i < total; i++) {
      await this.checkPause();
      const tx = transactions[i];
      const row = [
        format(tx.transactionDate, 'yyyy-MM-dd'),
        tx.transactionType,
        `"${(tx.merchantName || 'Unknown').replace(/"/g, '""')}"`,
        `"${tx.categoryId}"`, // In a real app, resolve category name
        tx.currency,
        tx.amount.toFixed(2),
        (tx.availableBalance || 0).toFixed(2),
        tx.sourceChannel
      ].join(',');
      
      csvContent += row + '\n';
      
      if (i % 10 === 0) {
        onProgress(Math.round((i / total) * 100));
      }
    }

    await FileSystem.writeAsStringAsync(path, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
    onProgress(100);
  }

  /**
   * PDF Generation logic using HTML templates
   */
  private static async generatePDF(options: ExportOptions, path: string, onProgress: (p: number) => void): Promise<void> {
    const { transactions, userName, startDate, endDate } = options;
    
    // Calculate totals for summary
    let totalIncome = 0;
    let totalExpenses = 0;
    const categoryTotals: Record<string, number> = {};

    transactions.forEach(tx => {
      if (tx.transactionType === 'credit') totalIncome += tx.amount;
      else totalExpenses += tx.amount;

      categoryTotals[tx.categoryId] = (categoryTotals[tx.categoryId] || 0) + tx.amount;
    });

    onProgress(20);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; }
          .cover { text-align: center; margin-top: 100px; page-break-after: always; }
          .title { font-size: 32px; font-weight: bold; color: #0B5CFF; }
          .subtitle { font-size: 18px; color: #666; margin-top: 10px; }
          .summary-card { background: #F5F5F5; padding: 20px; border-radius: 12px; margin: 20px 0; }
          .summary-row { display: flex; justify-content: space-between; margin: 10px 0; font-size: 16px; }
          .income { color: #00BD00; font-weight: bold; }
          .expense { color: #D30000; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 30px; }
          th { background: #0B5CFF; color: white; text-align: left; padding: 12px; font-size: 12px; }
          td { border-bottom: 1px solid #EEE; padding: 12px; font-size: 11px; }
          .page-title { font-size: 20px; margin-bottom: 20px; border-bottom: 2px solid #0B5CFF; padding-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="cover">
          <div class="title">SpendNG Transaction Report</div>
          <div class="subtitle">Prepared for: ${userName}</div>
          <div class="subtitle">Range: ${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}</div>
          <div class="summary-card">
            <div class="summary-row"><span>Total Income</span> <span class="income">${formatCurrency(totalIncome)}</span></div>
            <div class="summary-row"><span>Total Expenses</span> <span class="expense">-${formatCurrency(totalExpenses)}</span></div>
            <div class="summary-row"><span>Net Flow</span> <b>${formatCurrency(totalIncome - totalExpenses)}</b></div>
          </div>
          <div class="subtitle" style="margin-top: 50px;">Generated on: ${format(new Date(), 'PPPP p')}</div>
        </div>

        <div class="page-title">Transaction Details</div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Merchant</th>
              <th>Category</th>
              <th>Currency</th>
              <th>Amount</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            ${transactions.map(tx => `
              <tr>
                <td>${format(tx.transactionDate, 'yyyy-MM-dd')}</td>
                <td>${tx.transactionType.toUpperCase()}</td>
                <td>${tx.merchantName || 'Unknown'}</td>
                <td>${tx.categoryId}</td>
                <td>${tx.currency}</td>
                <td style="color: ${tx.transactionType === 'credit' ? '#00BD00' : '#D30000'}">
                  ${tx.transactionType === 'credit' ? '+' : '-'}${formatCurrency(tx.amount)}
                </td>
                <td>${formatCurrency(tx.availableBalance || 0)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    onProgress(60);

    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    await FileSystem.moveAsync({ from: uri, to: path });
    
    onProgress(100);
  }

  /**
   * Share the generated file
   */
  static async shareFile(path: string): Promise<void> {
    if (!(await Sharing.isAvailableAsync())) {
      throw new Error('Sharing is not available on this device');
    }
    await Sharing.shareAsync(path, {
      mimeType: path.endsWith('.pdf') ? 'application/pdf' : 'text/csv',
      dialogTitle: 'Export SpendNG Data',
      UTI: path.endsWith('.pdf') ? 'com.adobe.pdf' : 'public.comma-separated-values-text',
    });
  }
}
