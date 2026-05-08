# SpendNG — Database Schema (database.md)

## 1. Overview

This document defines the canonical database schema for SpendNG.

The system uses PostgreSQL (via Supabase) as the primary backend datastore. The schema is designed for:

- Strict multi-tenancy (row-level security per user)
- High-volume transaction ingestion
- Fast querying for dashboards and search
- Minimal write amplification from ingestion pipelines

All tables are user-scoped unless explicitly marked as system-level.

---

## 2. Design Principles

- Every financial record must be traceable to a single user
- Raw ingestion is separated from processed transactions
- System rules and user rules are unified under a single structure
- Indexing favors read-heavy patterns (dashboard + search)
- No cross-user data leakage is possible at the schema level

---

## 3. Core Tables

---

## 3.1 users

Stores authenticated user profiles.

| Column            | Type           | Constraints                          |
|------------------|----------------|--------------------------------------|
| user_id          | UUID           | Primary Key                          |
| email            | VARCHAR(255)   | Unique, not null                     |
| phone_number     | VARCHAR(20)    | Nullable, unique if provided         |
| password_hash    | VARCHAR(255)   | Managed by Supabase Auth             |
| display_name     | VARCHAR(100)   | Nullable                             |
| account_status   | ENUM           | active, suspended, deleted           |
| created_at       | TIMESTAMP      | Default now()                        |
| last_active_at   | TIMESTAMP      | Updated on login                     |

### Notes
- Authentication is handled externally by Supabase Auth
- This table mirrors user metadata only

---

## 3.2 transactions

Central financial record table.

| Column                     | Type           | Constraints                          |
|---------------------------|----------------|--------------------------------------|
| transaction_id            | UUID           | Primary Key                          |
| user_id                   | UUID           | FK → users(user_id)                  |
| amount                    | DECIMAL(15,2)  | Not null                             |
| currency                  | CHAR(3)        | Default: NGN                         |
| transaction_type          | ENUM           | credit, debit                        |
| merchant_name             | VARCHAR(255)   | Indexed                              |
| category_id               | INTEGER        | FK → categories(category_id)         |
| account_name              | VARCHAR(100)   | Nullable                             |
| account_number_last4      | CHAR(4)        | Nullable                             |
| transaction_date          | TIMESTAMP      | Indexed                              |
| available_balance         | DECIMAL(15,2)  | Nullable                             |
| source_channel            | ENUM           | sms, email, manual                   |
| raw_source_text           | TEXT           | Encrypted at rest                    |
| parse_confidence          | ENUM           | high, medium, low, manual            |
| is_duplicate              | BOOLEAN        | Default false                        |
| is_flagged_for_review     | BOOLEAN        | Default false                        |
| notes                     | TEXT           | Nullable                             |
| created_at                | TIMESTAMP      | Default now()                        |
| updated_at                | TIMESTAMP      | Auto-update                          |

### Indexes
- (user_id)
- (transaction_date)
- (category_id)
- (user_id, transaction_date)
- Full-text index on merchant_name

### Notes
- This is the primary query surface for all dashboards and exports
- All ingestion pipelines terminate here

---

## 3.3 categories

System and user-defined financial categories.

| Column                | Type         | Constraints                     |
|---------------------|--------------|---------------------------------|
| category_id         | INTEGER      | Primary Key                     |
| name                | VARCHAR(100) | Unique                          |
| icon_identifier     | VARCHAR(50)  | UI reference                    |
| color_hex           | CHAR(7)      | UI display color                |
| transaction_type_hint | ENUM        | credit, debit, both             |
| is_system           | BOOLEAN      | Default true                    |
| created_at          | TIMESTAMP    | Default now()                   |

### Default Categories
- Food and Dining
- Transport
- Utilities and Bills
- Airtime and Data
- Transfers Sent
- Transfers Received
- Salary and Wages
- Business Income
- Shopping
- Entertainment
- Health
- Education
- Rent and Housing
- Uncategorized

---

## 3.4 rules

Used by categorization engine.

| Column         | Type           | Constraints                        |
|---------------|----------------|------------------------------------|
| rule_id       | UUID           | Primary Key                        |
| user_id       | UUID           | FK → users (nullable for system)   |
| keyword       | VARCHAR(255)   | Indexed                            |
| match_type    | ENUM           | exact, contains, starts_with, regex|
| category_id   | INTEGER        | FK → categories                    |
| priority      | INTEGER        | Higher = stronger rule             |
| is_system     | BOOLEAN        | Default false                      |
| created_at    | TIMESTAMP      | Default now()                      |
| last_applied_at | TIMESTAMP    | Nullable                           |

### Notes
- User overrides always supersede system rules
- Rules evolve from user behavior

---

## 3.5 sync_logs

Audit trail for ingestion pipeline.

| Column              | Type           | Constraints                      |
|--------------------|----------------|----------------------------------|
| log_id             | UUID           | Primary Key                      |
| user_id            | UUID           | FK → users                       |
| source_channel     | ENUM           | sms, email                       |
| sender_identifier  | VARCHAR(100)   | Indexed                          |
| raw_content_hash   | CHAR(64)       | SHA-256                          |
| parse_status       | ENUM           | success, failed, duplicate, skipped |
| transaction_id     | UUID           | FK → transactions (nullable)     |
| failure_reason     | TEXT           | Nullable                         |
| processed_at       | TIMESTAMP      | Default now()                    |

### Notes
- Used for debugging ingestion and improving parser templates
- Critical for bank sender coverage expansion

---

## 3.6 failed_parses

Stores unstructured or failed ingestion attempts.

| Column            | Type         | Constraints                    |
|------------------|--------------|--------------------------------|
| failed_parse_id  | UUID         | Primary Key                    |
| user_id          | UUID         | FK → users                    |
| source_channel   | ENUM         | sms, email                    |
| sender_identifier| VARCHAR(100) | Indexed                       |
| raw_content      | TEXT         | Original message              |
| failure_reason   | TEXT         | Explanation                   |
| is_reviewed      | BOOLEAN      | Default false                |
| reviewed_at      | TIMESTAMP    | Nullable                     |
| created_at       | TIMESTAMP    | Default now()                |

### Notes
- Used for improving parsing templates
- Optional manual recovery path

---

## 4. Relationships

- users → transactions (1:N)
- users → rules (1:N)
- users → sync_logs (1:N)
- users → failed_parses (1:N)
- categories → transactions (1:N)
- categories → rules (1:N)

---

## 5. Indexing Strategy

### High Priority Indexes
- transactions(user_id, transaction_date)
- transactions(merchant_name)
- transactions(category_id)
- sync_logs(raw_content_hash)
- rules(user_id, priority)

### Search Optimization
- Full-text search enabled on:
  - merchant_name
  - notes

---

## 6. Row-Level Security (RLS)

All tables must enforce:

```sql
user_id = auth.uid()