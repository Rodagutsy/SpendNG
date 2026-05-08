# currency-policy

## Purpose

Defines how SpendNG version 1 stores, processes, displays, aggregates, searches, and exports multi-currency transaction data.

This policy is mandatory for all parsing logic, database writes, dashboard calculations, exports, and UI rendering.

Version 1 is a **currency preservation system**, not a currency conversion system.

---

# Core Rule

SpendNG version 1 must preserve every transaction in its original transaction currency.

The system must never:

- Convert currencies
- Normalize currencies
- Estimate equivalent values
- Fetch live or historical exchange rates
- Merge totals across different currencies

The exact currency detected from the original alert must be preserved throughout the entire product lifecycle.

---

# Supported Currencies

Version 1 supports only:

- `NGN` — Nigerian Naira
- `USD` — United States Dollar
- `GBP` — British Pound Sterling

No other currencies may be committed to the transactions table in version 1.

If an unsupported currency is detected:

- Parsing succeeds
- Transaction is stored in failed review state
- User does not see incomplete records
- Record is written to `failed_parses`

Examples:

Accepted:

- ₦15,000 → NGN
- NGN 15000 → NGN
- $250 → USD
- USD 250 → USD
- £80 → GBP
- GBP 80 → GBP

Rejected:

- EUR 100
- CAD 50
- USDC 100

---

# Parsing Rules

Currency detection happens during parsing before transaction commit.

Parser must normalize:

## NGN

Accepted patterns:

```regex
₦|NGN|Naira
```

Output:

```json
"currency": "NGN"
```

---

## USD

Accepted patterns:

```regex
\$|USD
```

Output:

```json
"currency": "USD"
```

---

## GBP

Accepted patterns:

```regex
£|GBP
```

Output:

```json
"currency": "GBP"
```

---

# Database Rules

Every transaction must store currency using ISO 4217.

Allowed values:

```sql
NGN
USD
GBP
```

Database writes containing unsupported currencies must fail validation.

Example:

```sql
currency CHAR(3) NOT NULL
```

---

# Dashboard Aggregation Rules

Dashboard totals must never combine different currencies.

Totals must always be grouped by currency.

Correct:

```txt
Income

NGN → ₦850,000
USD → $2,400
GBP → £600
```

Correct:

```txt
Expenses

NGN → ₦420,000
USD → $300
GBP → £90
```

Incorrect:

```txt
Total Income → ₦2,340,000
```

Cross-currency summation is prohibited.

---

# Month-over-Month Rules

Month comparisons must occur only within the same currency.

Correct:

```txt
NGN: +12%
USD: -5%
GBP: +8%
```

Incorrect:

```txt
Overall growth: +17%
```

Cross-currency comparisons are prohibited.

---

# Category Totals

Category summaries must remain currency-separated.

Correct:

```txt
Food

NGN → ₦45,000
USD → $120
```

Incorrect:

```txt
Food → ₦230,000 equivalent
```

Currency conversion is prohibited.

---

# Search Rules

Search must support currency filtering.

Examples:

- All USD transactions
- GBP transactions above £100
- NGN food transactions in April

Currency filters may be combined with:

- amount
- category
- merchant
- date
- account
- transaction type

---

# Export Rules

Exports must preserve original transaction currencies.

## PDF

Amounts must display original symbols:

Examples:

```txt
₦15,000
$250
£80
```

## CSV

Currency must be its own column.

Required column:

```csv
currency
```

Example:

```csv
amount,currency,type,merchant,date
15000,NGN,debit,Shoprite,2026-05-01
250,USD,credit,Grey,2026-05-02
80,GBP,credit,Lemfi,2026-05-03
```

---

# FX Rules

Version 1 must never call:

- Exchange rate APIs
- Currency conversion SDKs
- Forex services
- Banking FX endpoints

No external FX APIs are permitted.

No internal FX tables are permitted.

No cached exchange rates are permitted.

---

# UI Rules

Currency symbols must always match stored currency.

Mappings:

| Currency | Symbol |
|----------|--------|
| NGN | ₦ |
| USD | $ |
| GBP | £ |

Currency must never be inferred from locale.

Currency must always be derived from transaction data.

---

# Validation Rules

Transaction commit requires:

- valid amount
- valid date
- valid transaction type
- supported currency

If currency validation fails:

- transaction not committed
- raw source stored in failed parses
- sync log created

---

# Future Compatibility

Version 1 schema must remain extensible for future currencies.

Version 2 may introduce:

- EUR
- CAD
- USDC
- FX conversion
- Historical rate storage
- Base currency normalization

Version 1 explicitly forbids these features.

---

# Non-Negotiable Rules

These rules may never be broken:

- Original currency must always be preserved
- Cross-currency totals are prohibited
- Exchange rate conversion is prohibited
- External FX APIs are prohibited
- Currency inference from locale is prohibited
- Exports must preserve original currency
- Dashboard totals must be grouped by currency