# SpendNG — Feature Inventory & Testing Criteria

## 1. Authentication & Onboarding

| Feature | File(s) | Pass Criteria |
|---|---|---|
| Welcome screen | `app/(onboarding)/welcome` | Splash with "Get Started" navigates to sign-in |
| Sign In / Sign Up | Auth context | Supabase session created, redirects to `(tabs)` |
| Account creation | Auth context | New user row in `auth.users` with `onboarding_completed` flag |
| Email verification | Auth context | Unverified email blocks login; resend verification works |
| Forgot password | Auth context | Password reset email sent; new password accepted |
| SMS permission request | Onboarding flow | Permissions granted → next step; denied → graceful skip |
| Connect data source | `app/(onboarding)/connect-source` | SMS service initialized; test message shown |
| Import progress | Onboarding flow | Progress bar updates; completion sets `onboarding_completed` |
| Root redirect | `app/index.tsx` | No session → `/welcome`; no onboarding → `/connect-source`; done → `/(tabs)` |

**Edge cases:** user re-registers with same email, network timeout during verification, permission denied twice.

---

## 2. Home Dashboard

| Feature | File(s) | Pass Criteria |
|---|---|---|
| Monthly balance summary | `app/(tabs)/index.tsx` | Money-in / money-out / net balance match transaction totals for current month |
| Recent transactions list | `app/(tabs)/index.tsx` | Shows last 5 transactions, descending by date |
| Quick action: Scan Receipt | `app/(tabs)/index.tsx` | Camera opens → OCR text extracted → pre-fills manual entry |
| Quick action: Manual Entry | `app/(tabs)/index.tsx` | Navigates to `manual-entry.tsx` |
| Quick action: Import Statement | `app/(tabs)/index.tsx` | Navigates to `statement-import.tsx` |
| Quick action: Tax Prep | `app/(tabs)/index.tsx` | Navigates to `tax-prep.tsx` |
| FAB menu | `app/(tabs)/index.tsx` | Animated expand/collapse; background tap closes |
| Filing season banner | `app/(tabs)/index.tsx` | Shows Jan–Mar; CTA navigates to Tax Prep; dismiss persists 30 days |
| Connect SMS prompt | `app/(tabs)/index.tsx` | Shows when no SMS permissions; dismissible |

**Edge cases:** zero transactions for month, negative balance, banner dismissed then re-shown after 30 days.

---

## 3. Transaction Ingestion

| Feature | File(s) | Pass Criteria |
|---|---|---|
| SMS ingestion (bank alerts) | `lib/ingestion-engine.ts`, `lib/parser.ts` | Parses GTBank, Access, Zenith, FirstBank, UBA, Kuda, OPay, Moniepoint, PalmPay, Fidelity, FCMB, Wema, Stanbic, Ecobank, Polaris, Sterling, Providus formats → correct amount/type/merchant/date |
| Email ingestion | `lib/ingestion-engine.ts` | Parses same bank formats from email body; `source_channel = 'email'` |
| Duplicate detection | `content_hash` column | Same raw text returns existing row; `is_duplicate` flag set |
| Failed parse handling | `failed_parses` table | Unparseable messages stored for review; `is_reviewed` default false |
| Auto-categorization | `lib/categorization-engine.ts` | Merchant + amount heuristics → category_id assigned |
| Merchant normalization | `lib/merchant-normalization-engine.ts` | `alias_pattern` → `canonical_name` resolution; alias matching |
| Recurring payment detection | `lib/recurring-payment-detector.ts` | Same merchant + similar amount 3+ times → flagged |

**Edge cases:** unknown bank format, malformed SMS, partial amount, zero-amount transaction, very large amount (>10 digits).

---

## 4. Manual Entry

| Feature | File(s) | Pass Criteria |
|---|---|---|
| 6-step wizard | `app/manual-entry.tsx` | Type → Amount → Category → Payment Method → Description → Save |
| Currency picker | `app/manual-entry.tsx` | Tappable NGN→USD→GBP→EUR; live Naira equivalent shown |
| Receipt photo upload | `app/manual-entry.tsx` | ImagePicker opens camera/gallery; URI attached to transaction |
| Category picker | `app/manual-entry.tsx` | Lists all 21 categories; selected category highlighted |
| Payment method selection | `app/manual-entry.tsx` | Bank transfer, card, cash, POS, USSD, cheque |
| Save to Supabase | `app/manual-entry.tsx` | Row inserted; redirect to home with success alert |

**Edge cases:** empty required fields, photo too large, network error on save, amount contains commas/symbols.

---

## 5. Statement Import

| Feature | File(s) | Pass Criteria |
|---|---|---|
| CSV import | `lib/statement-parser/csv-generic.ts` | Column auto-detect; bank format identification |
| PDF import | `lib/statement-parser/pdf-parse.ts` | Supabase edge function processes PDF; returns parsed rows |
| Currency detection in CSV | `lib/statement-parser/csv-generic.ts` | `detectAmountCurrency()` handles `$`, `£`, `€` prefixes |
| Foreign currency conversion | `app/statement-import.tsx` | Non-NGN rows converted via `getNairaRate()` at import time |
| Parsed row preview | `app/statement-import.tsx` | Table of detected fields; user confirms before import |
| Batch insert | `app/statement-import.tsx` | All confirmed rows inserted; duplicates skipped |

**Edge cases:** empty CSV, mismatched columns, no rows parsed, CSV with mixed currencies, PDF with scanned images (OCR needed).

---

## 6. Transaction Management

| Feature | File(s) | Pass Criteria |
|---|---|---|
| Transaction list | `app/(tabs)/transactions/index.tsx` | FlatList with search, filter, sort |
| Search by keyword | `app/(tabs)/transactions/index.tsx` | Filters by merchant name; debounced |
| Filter modal | `components/FilterModal.tsx` | Date range, category, type (credit/debit), amount range |
| Sort options | `app/(tabs)/transactions/index.tsx` | Newest, oldest, highest, lowest |
| Pull-to-refresh | `app/(tabs)/transactions/index.tsx` | Refetches from Supabase |
| Transaction detail | TransactionModal | Full details shown; edit triggers recategorization |
| Recategorization | `app/recategorization.tsx` | Category picker; "apply to all same merchant" toggle |
| Rule creation from recategorization | `app/recategorization.tsx` | Creates rule with keyword = merchant |
| Rule conflict resolution | `app/rule-conflict.tsx` | "Replace" or "Keep Both" dialog |

**Edge cases:** 1000+ transactions (virtualized list performance), filter returning empty results, deleting category that is referenced.

---

## 7. Tax Prep Workflow (4 Steps)

### Step 1 — Income Review (`StepIncomeReview.tsx`)

| Feature | Pass Criteria |
|---|---|
| Lists all credit transactions | Shows merchant, amount, date, category |
| Tax class picker per transaction | 11 tax classes available |
| Bulk auto-classify button | All unclassified credits get tax class from category→tax default mapping |
| Foreign currency badge | Non-NGN transactions show currency badge (e.g. "USD") |
| Multi-select + bulk assign | Select multiple → assign tax class in one action |

### Step 2 — Expense Review (`StepExpenseReview.tsx`)

| Feature | Pass Criteria |
|---|---|
| Lists all debit transactions | Merchant, amount, date, category |
| Tax class picker per transaction | Same 11 tax classes |
| Business asset tracking | Add asset with name + value; stored in local state |
| Bulk auto-classify button | All unclassified debits get tax class from defaults |
| Multi-select + bulk assign | Same as income step |

### Step 3 — WHT Review (`StepWhtReview.tsx`)

| Feature | Pass Criteria |
|---|---|
| Lists all WHT-eligible income transactions | Income with tax class = "wht" or similar |
| Manual WHT entry | Add credit amount + source |
| Auto-suggest from income | Income transactions auto-populated as potential WHT sources |
| WHT credit total | Running total of all credits |

### Step 4 — Tax Summary (`StepTaxSummary.tsx`)

| Feature | Pass Criteria |
|---|---|
| Total income | Sum of all income-classified transactions |
| Total deductible expenses | Sum of all expense-classified transactions |
| Estimated taxable income | Total income − deductible expenses |
| WHT credits total | Sum of all WHT credits |
| Foreign income breakdown | List of non-NGN income with original amounts |
| CSV export | Transaction ledger with categories, tax classes, WHT |
| PDF export | Formatted ledger + category breakdown + disclaimers |
| Export with original currency | CSV/PDF include original amount + currency columns |

**Edge cases:** zero income, zero expenses, no WHT credits, all foreign currency, no transactions at all.

---

## 8. Foreign Currency Support

| Feature | File(s) | Pass Criteria |
|---|---|---|
| Currency detection in SMS | `lib/parser.ts` `tryGenericCurrency()` | `$500`, `£200`, `€300` detected; currency stored |
| Currency picker (manual entry) | `app/manual-entry.tsx` | NGN/USD/GBP/EUR toggle; live NGN equivalent |
| Exchange rate fetching | `lib/exchange-rate.ts` | Frankfurter API → cached in Supabase → manual fallback = 0 |
| Rate caching | `exchange_rates` table | Same date+currency return cached; miss → fetch → cache |
| Currency detection in CSV | `lib/statement-parser/csv-generic.ts` | `detectAmountCurrency()` detects `$`, `£`, `€` |
| Auto-conversion at ingestion | `lib/ingestion-engine.ts` | `getNairaRate()` called → `amount` set to NGN equivalent |
| Original amount/currency preserved | `transactions.original_currency`, `original_amount` | Always stored alongside converted amount |
| Display in tax prep | `StepIncomeReview.tsx`, `StepTaxSummary.tsx` | Badge on income items; breakdown in summary |
| Export with original currency | `lib/export-service.ts` | CSV: separate columns; PDF: ledger includes currency column |

**Edge cases:** Frankfurter API down, weekend rates (clamp to Friday), unsupported currency, rate returns 0, transaction date is a future date.

---

## 9. Export

| Feature | File(s) | Pass Criteria |
|---|---|---|
| CSV export | `lib/export-service.ts` | Transaction ledger with date, merchant, amount, category, tax class, currency |
| PDF export | `lib/export-service.ts` | Cover page + category breakdown + transaction ledger + disclaimer |
| Date range picker | `app/(tabs)/export.tsx` | Start/end date selectors |
| Format selector | `app/(tabs)/export.tsx` | CSV/PDF toggle |
| Progress indicator | `app/(tabs)/export.tsx` | Progress bar during generation |
| Foreign currency in export | `lib/export-service.ts` | Original amount + currency columns in CSV; note in PDF |

**Edge cases:** empty date range, 10,000+ transactions (memory), very long merchant names.

---

## 10. Insights

| Feature | File(s) | Pass Criteria |
|---|---|---|
| Cashflow engine | `lib/cashflow-engine.ts` | Monthly money-in/money-out/net calculated |
| Monthly bar chart | `app/(tabs)/insights/index.tsx` | 12-month overview with animated bars |
| Month detail drill-down | `app/(tabs)/insights/index.tsx` | Tap month → category breakdown + top merchants |
| Swipe-to-close detail | `app/(tabs)/insights/index.tsx` | Animated gesture closes month modal |
| Category breakdown | `app/(tabs)/insights/index.tsx` | Each category with amount + percentage |
| Top merchants | `app/(tabs)/insights/index.tsx` | Top 5 merchants by spend |

**Edge cases:** no data for selected month, partial month data, all income (no expenses) and vice versa.

---

## 11. OCR Receipt Scanning

| Feature | File(s) | Pass Criteria |
|---|---|---|
| Camera launch | `lib/ocr.ts` | ImagePicker opens camera |
| Text recognition | `lib/ocr.ts` | Text extracted from image |
| Transaction info extraction | `lib/ocr.ts` | Amount, merchant, date parsed from recognized text |
| Pre-fill manual entry | `app/(tabs)/index.tsx` | Extracted values passed to manual-entry as prefill |

---

## 12. Settings

| Feature | File(s) |
|---|---|
| Profile | Edit name, email, phone |
| Connected accounts | View linked SMS/email sources |
| Security | Change password, biometric toggle |
| Notifications | Toggle types |
| Data export | Link to export screen |
| Help | FAQ |
| Contact support | Email/compose |
| Terms | Webview |
| Privacy policy | Webview |

---

## 13. Infrastructure

| Component | Details |
|---|---|
| Supabase Auth | Email/password; session persistence |
| Supabase Database | `transactions`, `rules`, `merchant_normalization`, `failed_parses`, `exchange_rates`, `category_tax_defaults`, `tax_classifications` |
| RLS Policies | Row-level security on all user tables |
| Zustand stores | `transactionStore`, `categoryStore`, `categoryDefaultStore`, `taxClassificationStore`, `taxStore` |
| Auth Context | `AuthContext` provides session + user |
| Alert Context | `AlertContext` for toast/alert UI |
| Design Tokens | `constants/Tokens.ts` (Colors, Typography, Spacing, Radius, Shadows) |
| Tab Bar | Custom `_layout.tsx` with Home, Transactions, Insights, Settings |

---

## Notable Gaps / Known Issues

1. **WHT credits not persisted** to Supabase — only in Zustand store, lost on app restart
2. **No PIT bands applied** in summary — just income minus expenses
3. **No rent relief / pension / NHF deduction fields** in tax store
4. **`rate_source = 'manual'` returns rate 0** — no user fallback input for manual rate
5. **Exchange rate fails on weekends** — clamp only goes to Friday, but if Frankfurter also fails, returns 0
6. **No Form A PDF schema** — PDF export is a ledger, not a tax form
7. **No TIN field** — user enters only in PDF (per privacy strategy)
8. **No March 31 deadline reminder** — filing season banner only shows Jan–Mar
