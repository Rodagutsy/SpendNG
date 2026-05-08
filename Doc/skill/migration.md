# migrations

## Purpose

Defines the mandatory database migration strategy for SpendNG.

This skill governs how local database schema changes are introduced across application versions using WatermelonDB schema versioning.

The purpose of this policy is to ensure:

- zero transaction history loss
- zero destructive schema changes
- predictable upgrades
- backward-safe evolution
- offline-safe migrations
- encrypted database continuity

This policy applies to:

- WatermelonDB schemas
- SQLCipher encrypted databases
- local search indexes
- local rules tables
- synchronization metadata

This policy is non-negotiable.

---

# Core Principles

## Principle 1 — Migrations Are Additive Only

SpendNG migrations must always be additive.

Allowed:

- creating new tables
- adding new columns
- adding indexes
- adding optional metadata
- adding enum values where supported

Forbidden:

- dropping tables
- dropping columns
- renaming columns
- changing column types
- truncating tables
- rebuilding tables in ways that remove user data

No destructive migrations are permitted.

---

# Principle 2 — User Financial History Is Permanent

User transaction history is immutable.

The following data must never be deleted during migration:

- transactions
- categories
- user-created rules
- sync logs
- failed parses
- export metadata

Historical transaction records must survive every schema upgrade.

No migration may:

- purge records
- archive records
- overwrite user-created history
- collapse records
- merge records

Transaction history is permanent.

---

# Principle 3 — Every New Field Requires Safe Defaults

Every newly introduced field must have a default value.

No migration may introduce fields that create nullability ambiguity for existing rows.

Defaults must be deterministic.

Examples:

Boolean:

```txt id="8q7phx"
false
```

Text:

```txt id="8m2rdw"
""
```

Numeric:

```txt id="67dtrh"
0
```

Enum:

```txt id="j9a3uv"
"unknown"
```

Timestamp:

```txt id="e4cn9p"
existing row creation time
```

Forbidden:

- undefined defaults
- runtime-generated defaults
- network-fetched defaults
- user-input-required defaults

Migrations must complete without user interaction.

---

# Principle 4 — Rollback Is Unsupported

SpendNG does not support schema rollback.

Once a migration is committed:

- schema version only moves forward
- database version only increases
- old application builds are incompatible

Users who downgrade the app are unsupported.

The application must:

- detect schema mismatch
- block incompatible older clients
- instruct user to update

Rollback logic is prohibited.

---

# Principle 5 — Offline Migration Required

Every migration must complete fully offline.

Migrations must never depend on:

- Supabase
- internet connectivity
- API responses
- OAuth state
- cloud synchronization

All migrations must execute entirely on-device.

---

# Principle 6 — Encryption Continuity

Migrations must preserve SQLCipher encryption.

Schema upgrades must never:

- recreate an unencrypted database
- export plaintext rows
- write temporary plaintext files

Encrypted state must survive every version.

---

# Migration Lifecycle

Every migration follows this sequence.

## Step 1

App launch detects local schema version.

## Step 2

If local version is older:

migration begins.

## Step 3

Migration executes sequentially.

Example:

```txt id="gk8u3w"
v1 → v2 → v3
```

Direct skipping is allowed only through sequential execution.

Never:

```txt id="uk2dce"
v1 → v3 directly
```

without applying intermediate migrations.

## Step 4

Database integrity is verified.

## Step 5

Search indexes are refreshed if required.

## Step 6

Normal app startup continues.

---

# Version Strategy

# v1

## Purpose

Initial production schema.

Version 1 defines:

- users
- transactions
- categories
- rules
- sync_logs
- failed_parses

This is the baseline.

v1 databases contain:

- transaction history
- categorization rules
- parser logs
- exportable financial records

No migration occurs on fresh installs.

---

# v2

## Purpose

Metadata expansion.

Version 2 may introduce:

- user notes
- transaction tags
- review states
- parser confidence improvements
- enhanced categorization metadata

Allowed changes:

- add columns
- add indexes
- add metadata tables

Examples:

Possible fields:

- notes
- tags
- reviewed_at
- confidence_reason

Rules:

Every field must have safe defaults.

Existing transactions must remain untouched.

Historical amounts, currencies, and timestamps must not change.

---

# v3

## Purpose

Insight and analytics expansion.

Version 3 may introduce:

- monthly summaries
- cached dashboard aggregates
- behavioral analytics metadata
- search optimization tables
- derived statistics

Allowed changes:

- new summary tables
- new cache tables
- new local indexes
- derived metadata

Rules:

Derived data must be rebuildable.

Primary financial records remain source of truth.

If derived data becomes corrupted:

- rebuild derived tables
- never modify transactions

---

# Failed Migration Behavior

If migration fails:

The application must:

- stop startup
- preserve existing database
- never partially commit
- never wipe user data

User sees:

plain-language recovery guidance.

Forbidden:

- automatic reset
- automatic database deletion
- silent fallback

---

# Integrity Validation

After every migration, the system must validate:

## Transaction Count

Pre-migration count equals post-migration count.

## Currency Integrity

All currencies remain unchanged.

## Timestamp Integrity

Original transaction dates remain unchanged.

## Category Integrity

Category mappings remain unchanged.

## Rule Integrity

User-created rules remain intact.

## Search Integrity

Search indexes are rebuildable.

---

# Testing Requirements

Every migration must be tested against:

## Small Database

Less than 100 records.

## Medium Database

10,000 records.

## Large Database

50,000+ records.

## Interrupted Upgrade

App terminated mid-migration.

## Low Storage Device

Minimal free space.

## Offline Device

No connectivity.

Migration is not production-ready until all pass.

---

# Forbidden Operations

The following are permanently prohibited:

- deleting transactions
- deleting categories
- deleting user rules
- changing historical amounts
- changing historical currencies
- changing historical dates
- destructive schema resets
- automatic rollback
- migration requiring internet
- migration requiring user input

These rules may never be broken.