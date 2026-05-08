# SpendNG — Error Handling Specification (error-handling.md)

## 1. Overview

This document defines the error handling strategy for SpendNG across ingestion, parsing, categorization, authentication, and user interface layers.

The system is designed to fail safely, preserve data integrity, and avoid silent data loss under all conditions.

Core principle:

> No transaction should be silently dropped without traceability.

---

## 2. Error Handling Philosophy

SpendNG follows four strict principles:

1. **Deterministic failure behavior**
   - Every error must produce a known system state.

2. **No silent data loss**
   - Failed inputs are always logged in `failed_parses` or `sync_logs`.

3. **User-visible only when necessary**
   - Most backend errors are logged, not surfaced.

4. **Graceful degradation**
   - Partial functionality is preferred over complete failure.

---

## 3. Error Categories

---

## 3.1 Ingestion Errors (SMS / Email)

### 3.1.1 SMS Permission Denied

**Cause**
- User denies SMS access

**System Behavior**
- Disable SMS ingestion service
- Show onboarding recovery screen
- Offer email/manual entry alternatives

**User Message**
> “Without SMS access, SpendNG cannot automatically read bank alerts. You can still use email or manual entry.”

---

### 3.1.2 Background Service Killed (Android)

**Cause**
- OS kills SMS listener service (battery optimization)

**System Behavior**
- Attempt service restart
- Trigger fallback scheduled scan
- Prompt user to disable battery optimization

**Recovery Action**
- Guide user to device settings whitelist

---

### 3.1.3 Email OAuth Failure

**Cause**
- Invalid token
- User denies consent
- Provider outage

**System Behavior**
- Retry OAuth flow up to 3 times
- If persistent failure:
  - disable email ingestion
  - log failure in `sync_logs`

**User Message**
> “We could not connect your email. This may be temporary. Try again or skip for now.”

---

### 3.1.4 Unsupported Sender

**Cause**
- SMS/email not recognized as financial source

**System Behavior**
- Ignore message
- Do not process or notify user
- Optionally store sender metadata for future support expansion

---

## 3.2 Parsing Errors

---

### 3.2.1 Missing Required Fields

**Cause**
- Amount, date, or transaction type cannot be extracted

**System Behavior**
- Do NOT create transaction
- Store raw message in `failed_parses`
- Assign failure reason

---

### 3.2.2 Malformed Amount Format

**Cause**
- Unrecognized currency format or corrupted numeric value

**System Behavior**
- Attempt normalization
- If unresolved → mark as failed parse

---

### 3.2.3 Ambiguous Transaction Type

**Cause**
- Cannot determine credit vs debit

**System Behavior**
- Use sender-specific heuristics
- If still ambiguous:
  - mark as `low confidence`
  - flag for review

---

### 3.2.4 Multi-Message Split SMS

**Cause**
- Bank splits alert across multiple SMS

**System Behavior**
- Attempt concatenation using timestamp proximity and sender ID
- If merge succeeds → parse normally
- If merge fails → log partial message as failed parse

---

## 3.3 Duplicate Handling Errors

---

### 3.3.1 Duplicate Transaction Detection

**Cause**
- Same amount + merchant + timestamp window detected

**System Behavior**
- Suppress duplicate
- Store in `sync_logs` with status = `duplicate`
- Do not notify user

---

### 3.3.2 False Positive Duplicate Suppression

**Cause**
- Legitimate transaction incorrectly flagged as duplicate

**System Behavior**
- User reports missing transaction
- System provides manual restore flow
- Mark rule for review

---

## 3.4 Categorization Errors

---

### 3.4.1 No Matching Rule

**Cause**
- Merchant not found in rule set

**System Behavior**
- Assign `Uncategorized`
- Flag for review (low priority)

---

### 3.4.2 Conflicting Rules

**Cause**
- Multiple rules match same transaction

**System Behavior**
- Resolve using priority field
- If tie persists:
  - fallback to transaction-type rule
  - log conflict in system diagnostics

---

### 3.4.3 User Rule Override Conflict

**Cause**
- User-defined rule conflicts with system rule

**System Behavior**
- Prompt clarification only if recurring conflict detected
- Otherwise user rule takes precedence

---

## 3.5 Storage and Sync Errors

---

### 3.5.1 Database Write Failure

**Cause**
- Supabase unavailable or network failure

**System Behavior**
- Queue transaction locally
- Retry sync with exponential backoff
- Mark as “pending sync”

---

### 3.5.2 Sync Queue Overflow

**Cause**
- Offline usage exceeds local queue capacity

**System Behavior**
- Prioritize:
  1. Transactions
  2. Rules updates
  3. Logs
- Drop oldest logs if necessary (never drop transactions)

---

## 3.6 Authentication Errors

---

### 3.6.1 Invalid Token

**Cause**
- Expired or revoked JWT

**System Behavior**
- Attempt refresh
- If refresh fails → force logout

**User Message**
> “Your session has expired. Please log in again.”

---

### 3.6.2 Multiple Device Conflict

**Cause**
- Token invalidated from another device (if global logout triggered)

**System Behavior**
- Local session cleared
- Redirect to login screen

---

## 3.7 Export Errors

---

### 3.7.1 Empty Dataset Export

**Cause**
- No transactions in selected range

**System Behavior**
- Block export
- Prompt user to adjust range

---

### 3.7.2 Memory Limit Exceeded (PDF Generation)

**Cause**
- Large dataset exceeds device memory

**System Behavior**
- Fallback to CSV export
- Notify user of downgrade

---

### 3.7.3 Insufficient Storage

**Cause**
- Device storage too low for export file

**System Behavior**
- Pre-check storage before generation
- Block export if insufficient

---

## 3.8 UI and UX Errors

---

### 3.8.1 Search Returns No Results

**Behavior**
- Do not show error state
- Show empty state with active filters
- Provide “Clear Filters” action

---

### 3.8.2 Slow Search Performance

**Cause**
- Large dataset on low-end device

**System Behavior**
- Switch to incremental result rendering
- Degrade gracefully without blocking UI

---

## 4. Logging Strategy

All errors must be logged in one of:

- `sync_logs` → ingestion and processing errors
- `failed_parses` → unstructured parsing failures
- local device logs → UI and runtime issues

### Required Log Fields
- timestamp
- user_id
- error_type
- source_channel (if applicable)
- raw_hash (for traceability)
- failure_reason
- recovery_action_taken

---

## 5. Retry Policy

| Error Type            | Retry Behavior              |
|----------------------|----------------------------|
| SMS ingestion        | Continuous (event-driven)  |
| Email sync           | Exponential backoff        |
| Parsing              | No retry                   |
| Database write       | 3 retries                  |
| OAuth failure        | 3 attempts max             |

---

## 6. User Communication Rules

Only surface errors to users when:

- Data is missing or incomplete in UI
- Action is required from user
- Permission is denied
- Export fails
- Authentication fails

Never show:
- parsing errors
- duplicate detection
- background sync failures

---

## 7. Data Safety Rules

Under all failure conditions:

- Transactions must not be deleted silently
- Failed parses must be stored for review
- Partial data must still be usable
- No cross-user error leakage is allowed

---

## 8. Summary

SpendNG error handling is designed around one constraint:

> Financial data integrity is more important than system availability.

The system must degrade, queue, retry, and recover—but never silently lose financial records.