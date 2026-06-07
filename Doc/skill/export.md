# spendng-export

## Purpose

Defines all export behavior, formats, generation rules, and failure handling.

Export reliability is mission-critical.

---

## 1. Supported Formats

SpendNG supports:

- PDF
- CSV

No additional formats in V1.

---

## 2. PDF Export Structure

### Header Section

Contains:
- SpendNG logo/name
- User name
- Export range (start date to end date)
- Generated timestamp

### Summary Section

Must include:
- Total income
- Total expenses
- Net flow

### Transaction Table

Columns (fixed order):
1. Date
2. Amount
3. Type
4. Merchant
5. Category
6. Source

---

## 3. CSV Format

Exact headers:

Date,Amount,Currency,Type,Merchant,Category,Account Name,Account (Last 4),Available Balance,Source,Notes,Flagged for Review

Date format: YYYY-MM-DD HH:mm:ss

---

## 4. Currency Formatting

NGN:
₦5,000.00

USD:
$5,000.00

GBP:
£5,000.00

---

## 5. File Naming

Format:

SpendNG_Export_YYYY-MM-DD_HHmmss.{ext}

Extension depends on format:
- `.csv` for CSV
- `.pdf` for PDF

---

## 6. Generation

Generate on-device using:
- **CSV**: `expo-file-system` writes UTF-8 CSV to cache directory
- **PDF**: `expo-print.printToFileAsync()` renders HTML table, file moved to cache directory

Files are placed in the app's cache directory and shared via the OS share sheet.

Never upload for cloud rendering.

---

## 7. Share Sheet

Uses `expo-sharing.shareAsync()` which opens the native OS share sheet, providing:
- Save to device
- Share via app
- Email directly

---

## 8. Empty Range

Before generation:

Validate record count.

If zero:

Show:
"No transactions found for this period."

Do not generate empty file.

---

## 9. Interrupted Export

If export is cancelled:
- AbortController cancels the in-progress generation
- File is not written

Pause/resume is supported via `setPaused()`.

---

## 10. Accessibility

Export progress must announce:

"Export in progress. X percent complete."

---

## 11. Testing

Test:
- 1 transaction
- 10,000 transactions
- Low storage
- Background interruption
- Offline export
