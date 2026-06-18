import { BankFormat, detectBankFormat, NIGERIAN_BANK_FORMATS } from './bank-formats';
import { parseCSV, autoDetectColumnMapping, ColumnMapping, ParsedStatementRow } from './csv-generic';
import { extractPDFText, pdfToCSVLines } from './pdf-extract';

export type StatementFileType = 'csv' | 'pdf';

export interface StatementParseResult {
  rows: ParsedStatementRow[];
  detectedBank: string | null;
  columnMapping: ColumnMapping;
  totalRows: number;
  fileType: StatementFileType;
}

export { ParsedStatementRow, ColumnMapping, BankFormat };

export class StatementParser {
  static async parse(
    content: string | ArrayBuffer,
    fileType: StatementFileType,
    bankName?: string,
    columnMapping?: ColumnMapping,
  ): Promise<StatementParseResult> {
    if (fileType === 'pdf') {
      const buffer = content instanceof ArrayBuffer ? content : new TextEncoder().encode(content).buffer;
      const extracted = await extractPDFText(buffer);
      const csvContent = pdfToCSVLines(extracted.raw);
      return this.parseCSVContent(csvContent, bankName, columnMapping, 'pdf');
    }

    return this.parseCSVContent(content as string, bankName, columnMapping, 'csv');
  }

  private static parseCSVContent(
    csvContent: string,
    bankName?: string,
    columnMapping?: ColumnMapping,
    fileType: StatementFileType = 'csv',
  ): StatementParseResult {
    const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const headers = lines.length > 0 ? lines[0].split(',').map((h) => h.trim()) : [];

    let format: BankFormat | null = null;
    if (bankName) {
      format = NIGERIAN_BANK_FORMATS.find(
        (f) => f.name.toLowerCase() === bankName.toLowerCase() || f.keywords.some((k) => bankName.toLowerCase().includes(k)),
      ) ?? null;
    }
    if (!format) {
      format = detectBankFormat(headers, []);
    }

    const mapping = columnMapping ?? (format ? autoDetectColumnMapping(headers, format) : { dateIndex: -1, descriptionIndex: -1, inflowIndex: -1, outflowIndex: -1, balanceIndex: null });

    const rows = parseCSV(csvContent, mapping, format);

    return {
      rows,
      detectedBank: format?.name ?? null,
      columnMapping: mapping,
      totalRows: rows.length,
      fileType,
    };
  }
}
