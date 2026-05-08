# SpendNG — Architecture Document

## 1. Overview

SpendNG is a mobile-first financial aggregation system that passively reconstructs a user’s transaction history by processing SMS alerts and email notifications from Nigerian banks and fintech platforms. It operates without bank API dependencies, using on-device ingestion and parsing as its primary data source.

The system is designed for:
- Low-end Android devices
- Intermittent connectivity environments
- High data privacy constraints
- Multi-source financial fragmentation (banks, fintechs, wallets)

The architecture prioritizes on-device processing, minimal cloud dependency, and resilience over sophistication.

---

## 2. Core Architectural Principles

### 2.1 Privacy by Default
- Raw SMS and email content never leaves the device
- Only structured transaction records are synced to the backend
- OAuth tokens are stored in secure OS keychains only

### 2.2 Offline-First Operation
- SMS ingestion, parsing, categorization, and search function offline
- Cloud services are optional and primarily for backup and export scaling

### 2.3 Low-End Device Resilience
- Designed for Android devices with limited RAM and aggressive background killing
- Background services are lightweight and restart-safe

### 2.4 Deterministic Processing
- Parsing and categorization rely on rule-based engines rather than probabilistic ML models in version 1
- Predictability is preferred over adaptive complexity

---

## 3. High-Level System Architecture
              ┌──────────────────────────┐
              │   SMS / Email Sources    │
              │ (Banks, Fintechs, Wallets)
              └─────────────┬────────────┘
                            │
            ┌───────────────▼───────────────┐
            │   On-Device Ingestion Layer   │
            │  - SMS Listener (Android)     │
            │  - Email Polling Service      │
            └───────────────┬───────────────┘
                            │
            ┌───────────────▼───────────────┐
            │   Parsing Engine (Local)      │
            │  - Regex templates per bank   │
            │  - Field extraction logic     │
            └───────────────┬───────────────┘
                            │
            ┌───────────────▼───────────────┐
            │ Categorization Engine (Local) │
            │  - Rules engine               │
            │  - Merchant mapping           │
            └───────────────┬───────────────┘
                            │
            ┌───────────────▼───────────────┐
            │ Local Database (WatermelonDB) │
            │  - Transactions               │
            │  - Rules                      │
            │  - Categories                 │
            └───────────────┬───────────────┘
                            │
             ┌──────────────▼──────────────┐
             │ Sync Layer (Optional Cloud) │
             │        Supabase             │
             │  - Backup                   │
             │  - Export support          │
             │  - Multi-device sync       │
             └──────────────┬──────────────┘
                            │
            ┌───────────────▼───────────────┐
            │        Frontend UI            │
            │   React Native App            │
            │ - Dashboard                  │
            │ - Search                     │
            │ - Export                     │
            │ - Manual entry              │
            └───────────────────────────────┘

            
---

## 4. Client Architecture (Mobile App)

### 4.1 Framework
- React Native (single codebase for iOS and Android)

### 4.2 State Management
- Zustand for global state
- Local-first synchronization model

### 4.3 Local Storage
- WatermelonDB (SQLite-based)
- Encrypted via SQLCipher
- Stores:
  - Transactions
  - Categories
  - Rules
  - Sync logs
  - Failed parses

### 4.4 Navigation
- React Navigation (stack + bottom tabs)
- Primary screens:
  - Home Dashboard
  - Transactions
  - Search
  - Export
  - Settings

---

## 5. Data Ingestion Architecture

### 5.1 SMS Ingestion (Android Primary Channel)

**Flow:**
1. OS delivers SMS
2. Background SMS listener intercepts message
3. Sender validation occurs
4. Message passed to parsing engine
5. Parsed result stored locally

**Key constraints:**
- Must survive OS background termination
- Must rehydrate from inbox on restart
- Must deduplicate aggressively

---

### 5.2 Email Ingestion

**Flow:**
1. OAuth connection (Gmail / Outlook)
2. Background polling every 15 minutes
3. Fetch only financial senders
4. Parse email body
5. Store structured transaction

**Constraints:**
- Rate-limit aware polling
- No access to non-financial emails
- Token refresh handled automatically

---

## 6. Parsing Engine Architecture

### 6.1 Design
Rule-based extraction system using:
- Sender-specific templates
- Regex extraction rules
- Fallback heuristics

### 6.2 Output Schema
Each parsed transaction produces:

- Amount
- Currency
- Transaction type (credit/debit)
- Merchant/sender
- Timestamp
- Account reference
- Balance (optional)
- Raw text reference
- Confidence score

### 6.3 Confidence Model
- High: full structured match
- Medium: partial missing fields
- Low: heuristic reconstruction

### 6.4 Failure Handling
- Failed parses stored in `failed_parses`
- No silent data loss
- Manual review possible

---

## 7. Categorization Engine

### 7.1 Architecture
Hybrid rule-based classifier:
- Exact merchant match
- Keyword match
- Transaction-type heuristics

### 7.2 Category Set
System-defined categories:
- Food and Dining
- Transport
- Utilities
- Airtime/Data
- Transfers
- Salary
- Business Income
- Shopping
- Rent
- Education
- Health
- Uncategorized

### 7.3 Learning Loop
- User overrides category
- Rule automatically updated locally
- Future transactions adapt immediately

---

## 8. Sync Architecture (Cloud Layer)

### 8.1 Backend
- Supabase (PostgreSQL + Auth + Edge Functions)

### 8.2 Purpose
- Backup transactions
- Cross-device sync
- Export generation support
- Recovery layer

### 8.3 Sync Strategy
- Local-first writes
- Async background sync
- Conflict resolution:
  - Last-write-wins for metadata
  - Append-only for transactions

---

## 9. Export System Architecture

### 9.1 Generation Modes
- On-device export (default)
- Server-side export (for large datasets)

### 9.2 Formats
- CSV (structured data export)
- PDF (human-readable financial report)

### 9.3 PDF Structure
- Summary metrics
- Category breakdown
- Transaction table

---

## 10. Background Services

### 10.1 Android Services
- Foreground SMS listener service
- Battery-optimized restart handler
- Boot event reinitialization

### 10.2 Email Polling Service
- Scheduled background fetch
- Adaptive retry on failure
- Rate-limit aware scheduling

---

## 11. Security Architecture

### 11.1 Data Protection
- SQLCipher encrypted local database
- TLS 1.3 for all network traffic
- Keychain/Keystore for sensitive credentials

### 11.2 Privacy Boundaries
- Raw SMS never transmitted to backend
- Email content filtered before processing
- No third-party analytics SDKs

### 11.3 Access Control
- Supabase Row-Level Security enforced
- User-scoped data isolation

---

## 12. Analytics Architecture

### 12.1 System
- Self-hosted Plausible analytics

### 12.2 Events (Non-identifiable)
- App opens
- Transaction ingestion success/failure
- Export usage
- Search usage

### 12.3 Exclusions
- No behavioral tracking profiles
- No cross-user identity linking

---

## 13. Failure Modes and Recovery

### 13.1 SMS Service Killed
- Detect missing heartbeat
- Prompt battery optimization whitelist

### 13.2 Parser Failure Spike
- Log sender-specific failure rate
- Flag for template update

### 13.3 Sync Failure
- Local queue persists unsynced records
- Retry with exponential backoff

### 13.4 Storage Constraints
- Degrade export to CSV only
- Disable large PDF generation

---

## 14. Scalability Considerations

- Parsing remains on-device to avoid backend bottlenecks
- Supabase used as passive storage layer, not compute engine
- Email polling distributed per-user (no centralized queue pressure)
- Stateless backend functions for export only

---

## 15. Summary

SpendNG is intentionally structured as a **local-first financial reconstruction system** rather than a traditional fintech backend application. The architecture prioritizes:

- Device-side intelligence over cloud processing
- Deterministic rule systems over ML complexity
- Data ownership on the user device
- Minimal backend responsibilities

This ensures the product remains functional in constrained environments while scaling linearly with user growth.