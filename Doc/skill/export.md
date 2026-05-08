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

### Page 1 — Cover Page

Must contain:

- User name
- Export range
- Generated timestamp
- Total income
- Total expenses
- Net flow

---

## 3. Summary Section

Must include:

- Category totals
- Percentage breakdown
- Month-over-month comparison

---

## 4. Transaction Table

Columns:

1. Date
2. Type
3. Merchant
4. Category
5. Currency
6. Amount
7. Balance

This order is fixed.

---

## 5. CSV Format

Exact headers:

Date,Type,Merchant,Category,Currency,Amount,Balance,Source

Date format:

YYYY-MM-DD

---

## 6. Currency Formatting

NGN:
₦5,000.00

USD:
$5,000.00

GBP:
£5,000.00

---

## 7. File Naming

Format:

SpendNG_Export_YYYY-MM-DD_to_YYYY-MM-DD

Example:

SpendNG_Export_2026-01-01_to_2026-01-31

---

## 8. Generation Rules

### Preferred

Generate on-device.

### Fallback

If dataset exceeds device memory:

Fallback:

CSV

Never upload for cloud rendering.

---

## 9. Share Sheet

Must always show:

- Save to device
- Share via app
- Email directly

All three options are mandatory.

---

## 10. Empty Range

Before generation:

Validate record count.

If zero:

Show:

"No transactions found for this period."

Do not generate empty file.

---

## 11. Storage Check

Before generation:

Estimate file size.

If insufficient storage:

Show:

"Not enough space to create this file."

---

## 12. Interrupted Export

If app backgrounds:

- Pause generation
- Resume on foreground

Never restart.

---

## 13. Accessibility

Export progress must announce:

"Export in progress. X percent complete."

---

## 14. Testing

Test:

- 1 transaction
- 10,000 transactions
- Low storage
- Background interruption
- Offline export