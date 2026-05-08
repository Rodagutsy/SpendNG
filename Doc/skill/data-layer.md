---
name: spendng-data-layer
description: Complete data architecture for SpendNG covering WatermelonDB schema, Supabase tables, sync rules, query patterns, and offline behavior. Use this skill before writing any code that reads or writes data, defines a database schema, builds a query, or handles sync. Triggers for all data operations in SpendNG without exception.
---

# SpendNG Data Layer

This skill defines how all data is structured, stored, queried, and synced in SpendNG.
Never design a schema, write a query, or make a sync decision without consulting this document first.

---

## 1. Architecture Overview

SpendNG uses a two-database architecture:

**On-Device (WatermelonDB + SQLCipher)**
- Primary store for all user data
- All reads for UI happen from here — never directly from Supabase
- Must function fully offline
- Encrypted with SQLCipher at all times

**Cloud (Supabase PostgreSQL)**
- Backup and cross-device sync store
- Source of truth for account authentication
- Writes to Supabase happen asynchronously after local commit
- A Supabase write failure must never block or roll back a local operation

**Rule:** The UI never waits for Supabase. Local first, sync in background.

---

## 2. WatermelonDB Schema

### 2.1 transactions table

```javascript
tableSchema({
  name: 'transactions',
  columns: [
    { name: 'remote_id', type: 'string', isOptional: true },       // Supabase UUID after sync
    { name: 'amount', type: 'number' },                             // Always positive decimal
    { name: 'currency', type: 'string' },                           // ISO 4217, default 'NGN'
    { name: 'transaction_type', type: 'string' },                   // 'credit' | 'debit'
    { name: 'merchant_name', type: 'string', isOptional: true },
    { name: 'category_id', type: 'string' },                        // FK to categories
    { name: 'account_name', type: 'string', isOptional: true },     // Bank/fintech name
    { name: 'account_number_last4', type: 'string', isOptional: true },
    { name: 'transaction_date', type: 'number' },                   // Unix timestamp
    { name: 'available_balance', type: 'number', isOptional: true },
    { name: 'source_channel', type: 'string' },                     // 'sms' | 'email' | 'manual'
    { name: 'raw_source_text', type: 'string', isOptional: true },  // Original alert — never transmitted raw
    { name: 'parse_confidence', type: 'string', isOptional: true }, // 'high' | 'medium' | 'low' | 'manual'
    { name: 'is_duplicate', type: 'boolean' },
    { name: 'is_flagged_for_review', type: 'boolean' },
    { name: 'notes', type: 'string', isOptional: true },
    { name: 'is_synced', type: 'boolean' },                         // False until confirmed synced to Supabase
    { name: 'created_at', type: 'number' },                         // Unix timestamp
    { name: 'updated_at', type: 'number' },
  ],
})
```

### 2.2 categories table

```javascript
tableSchema({
  name: 'categories',
  columns: [
    { name: 'remote_id', type: 'string', isOptional: true },
    { name: 'name', type: 'string' },
    { name: 'icon_identifier', type: 'string' },
    { name: 'color_hex', type: 'string' },
    { name: 'transaction_type_hint', type: 'string' },   // 'credit' | 'debit' | 'both'
    { name: 'is_system', type: 'boolean' },
    { name: 'created_at', type: 'number' },
  ],
})
```

### 2.3 rules table

```javascript
tableSchema({
  name: 'rules',
  columns: [
    { name: 'remote_id', type: 'string', isOptional: true },
    { name: 'keyword', type: 'string' },
    { name: 'match_type', type: 'string' },              // 'exact' | 'contains' | 'starts_with' | 'regex'
    { name: 'category_id', type: 'string' },
    { name: 'priority', type: 'number' },
    { name: 'is_system', type: 'boolean' },
    { name: 'last_applied_at', type: 'number', isOptional: true },
    { name: 'created_at', type: 'number' },
  ],
})
```

### 2.4 sync_logs table

```javascript
tableSchema({
  name: 'sync_logs',
  columns: [
    { name: 'remote_id', type: 'string', isOptional: true },
    { name: 'source_channel', type: 'string' },
    { name: 'sender_identifier', type: 'string' },
    { name: 'raw_content_hash', type: 'string' },         // SHA-256 of raw message
    { name: 'parse_status', type: 'string' },             // 'success' | 'failed' | 'duplicate' | 'skipped'
    { name: 'transaction_id', type: 'string', isOptional: true },
    { name: 'failure_reason', type: 'string', isOptional: true },
    { name: 'processed_at', type: 'number' },
  ],
})
```

### 2.5 failed_parses table

```javascript
tableSchema({
  name: 'failed_parses',
  columns: [
    { name: 'remote_id', type: 'string', isOptional: true },
    { name: 'source_channel', type: 'string' },
    { name: 'sender_identifier', type: 'string' },
    { name: 'failure_reason', type: 'string' },
    { name: 'is_reviewed', type: 'boolean' },
    { name: 'reviewed_at', type: 'number', isOptional: true },
    { name: 'created_at', type: 'number' },
  ],
})
```

**Note:** `raw_content` is intentionally excluded from the WatermelonDB failed_parses schema. Raw message content for failed parses is stored only in Supabase failed_parses with column-level encryption. On-device failed parse records store the failure reason and sender only.

---

## 3. Supabase Schema

The Supabase schema mirrors the WatermelonDB schema with the following differences:

- All primary keys are UUIDs generated by Supabase
- All timestamps are `TIMESTAMPTZ` in Supabase, converted from Unix timestamps on sync
- The `users` table exists only in Supabase — not in WatermelonDB
- `raw_source_text` in Supabase transactions is encrypted at column level using `pgcrypto`
- `raw_content` in Supabase failed_parses is encrypted at column level

**Supabase-only columns added on sync:**
- `user_id UUID` — FK to `auth.users`, used for RLS
- `synced_at TIMESTAMPTZ` — when the record arrived in Supabase

---

## 4. Sync Rules

### 4.1 What Syncs and When

| Data | Direction | Trigger |
|---|---|---|
| New transaction | Device → Supabase | Immediately after local commit, if online |
| Updated transaction (recategorized, noted) | Device → Supabase | On save, if online; queued if offline |
| User-created rules | Device → Supabase | On save |
| Sync logs | Device → Supabase | Batched every 5 minutes |
| Failed parse reasons (no raw content) | Device → Supabase | Batched every 5 minutes |
| System categories | Supabase → Device | On first install and on app update |
| System rules | Supabase → Device | On first install and on app update |

### 4.2 Offline Queue

When a device is offline, all writes are queued locally with `is_synced: false`. When connectivity is restored:
1. Process the queue in chronological order
2. For each queued item, attempt the Supabase write
3. On success, update `is_synced: true` locally
4. On failure, retry with exponential backoff: 30s, 2m, 10m, 30m, then once per hour
5. After 7 days of failed sync, notify the user that some data may not be backed up

**Rule:** A sync failure never rolls back a local record. Local data is always preserved.

### 4.3 Conflict Resolution

If the same transaction is modified on two devices before sync:
- Last-write-wins based on `updated_at` timestamp
- The version with the later `updated_at` is kept
- The earlier version is discarded without user notification unless the conflicting field is `category_id` — in that case, surface the conflict to the user

---

## 5. Query Patterns

### 5.1 Dashboard — Current Month Totals

```javascript
const startOfMonth = dayjs().startOf('month').unix();
const endOfMonth = dayjs().endOf('month').unix();

const credits = await database
  .get('transactions')
  .query(
    Q.where('transaction_type', 'credit'),
    Q.where('transaction_date', Q.gte(startOfMonth)),
    Q.where('transaction_date', Q.lte(endOfMonth)),
    Q.where('is_duplicate', false)
  )
  .fetch();

const totalIncome = credits.reduce((sum, t) => sum + t.amount, 0);
```

Apply the same pattern for debits to get total spending.

### 5.2 Dashboard — Category Breakdown

```javascript
const transactions = await database
  .get('transactions')
  .query(
    Q.where('transaction_type', 'debit'),
    Q.where('transaction_date', Q.gte(startOfMonth)),
    Q.where('transaction_date', Q.lte(endOfMonth)),
    Q.where('is_duplicate', false)
  )
  .fetch();

const byCategory = transactions.reduce((acc, t) => {
  acc[t.category_id] = (acc[t.category_id] || 0) + t.amount;
  return acc;
}, {});
```

### 5.3 Month-over-Month Comparison

Query current month and previous month using the same pattern as 5.1. Calculate delta as `((current - previous) / previous) * 100`. Handle the case where previous month total is zero to avoid division by zero.

### 5.4 Search

```javascript
const results = await database
  .get('transactions')
  .query(
    Q.where('is_duplicate', false),
    // Apply filters conditionally based on what the user has set
    ...(keyword ? [Q.where('merchant_name', Q.like(`%${Q.sanitizeLikeString(keyword)}%`))] : []),
    ...(categoryId ? [Q.where('category_id', categoryId)] : []),
    ...(transactionType ? [Q.where('transaction_type', transactionType)] : []),
    ...(startDate ? [Q.where('transaction_date', Q.gte(startDate))] : []),
    ...(endDate ? [Q.where('transaction_date', Q.lte(endDate))] : []),
    Q.sortBy('transaction_date', Q.desc)
  )
  .fetch();
```

**Performance rule:** Search must return results in under 2 seconds for up to 50,000 records. Always use `Q.sanitizeLikeString` to prevent injection. Index `merchant_name`, `transaction_date`, `category_id`, and `transaction_type`.

---

## 6. Predefined Categories Seed Data

These categories must be seeded on first install. `is_system: true` for all of them.

| ID | Name | Type Hint | Icon | Color |
|---|---|---|---|---|
| cat-01 | Food & Dining | debit | fork-knife | `#FF6B35` |
| cat-02 | Transport | debit | car | `#4ECDC4` |
| cat-03 | Utilities & Bills | debit | lightning | `#FFE66D` |
| cat-04 | Airtime & Data | debit | phone | `#A8E6CF` |
| cat-05 | Transfers Sent | debit | arrow-up | `#C5C3BF` |
| cat-06 | Transfers Received | credit | arrow-down | `#99BBFF` |
| cat-07 | Salary & Wages | credit | briefcase | `#0B5CFF` |
| cat-08 | Business Income | credit | chart-up | `#00AACC` |
| cat-09 | Shopping | debit | bag | `#FF9999` |
| cat-10 | Entertainment | debit | play | `#CC99FF` |
| cat-11 | Health | debit | heart | `#FF6666` |
| cat-12 | Education | debit | book | `#66B2FF` |
| cat-13 | Rent & Housing | debit | home | `#997300` |
| cat-14 | Uncategorized | both | question | `#ADAAA4` |

---

## 7. Offline Behavior Rules

| Feature | Offline Behavior |
|---|---|
| SMS ingestion | Fully functional — processes and stores locally |
| Transaction parsing | Fully functional — runs on device |
| Categorization | Fully functional — rules are local |
| Dashboard | Fully functional — queries local DB |
| Search | Fully functional — queries local DB |
| Manual entry | Fully functional — writes locally, queues sync |
| Export to device | Fully functional — generates from local DB |
| Email polling | Suspended — shows status indicator in settings |
| Cloud backup sync | Suspended — queues all writes |
| Export via email | Suspended — user can save to device instead |

**Rule:** Offline state must be communicated to the user through a status indicator in Settings only. The home screen must never show an error or warning banner for offline state — it must simply function on local data without drawing attention to the lack of connectivity.