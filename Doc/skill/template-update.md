# template-update-service

## Purpose

Defines the remote template delivery system for SpendNG.

This service exists to distribute updated parsing templates to mobile clients without requiring an app store release.

Templates include:

- SMS parser templates
- email parser templates
- sender identification rules
- amount normalization rules
- date normalization rules
- parsing confidence metadata
- categorization mapping updates

This service does not parse user messages.

This service only distributes template definitions.

---

# Platform

SpendNG must use:

:contentReference[oaicite:2]{index=2} Edge Functions

for template distribution.

Edge Functions act as:

- template registry
- version resolver
- update distributor
- rollback controller

Edge Functions never process user transaction content.

---

# Core Principles

## Principle 1 — Parsing Remains On Device

All parsing happens locally.

The template update service never:

- reads user SMS
- reads user email content
- reads transaction payloads
- receives parser failures containing raw content

The server distributes templates only.

---

## Principle 2 — Raw SMS Content Never Leaves Device

Raw SMS content is never transmitted.

Raw email content is never transmitted.

Forbidden:

- alert text uploads
- parser debugging uploads
- crash reports containing message content
- template matching payload uploads

Only structured application metadata may be transmitted.

Examples:

Allowed:

```txt id="g1x4tm"
app_version
platform
template_version
last_sync_at
```

Forbidden:

```txt id="w6d9fq"
raw_sms_text
raw_email_body
merchant_message_body
transaction_alert_payload
```

---

# Template Package

Each template package contains:

## Sender Definitions

Examples:

- GTBank
- Access Bank
- First Bank
- Zenith
- UBA
- Kuda
- Opay
- Moniepoint

## Parsing Rules

Includes:

- regex definitions
- field extraction rules
- delimiter rules
- currency detection rules
- date normalization rules

## Confidence Rules

Includes:

- high
- medium
- low

## Categorization Updates

Includes:

- merchant mappings
- category refinements

---

# Versioning Strategy

Every template package must be versioned.

Versioning format:

```txt id="m7k3qb"
major.minor.patch
```

Example:

```txt id="t4f8zu"
1.0.0
1.1.0
1.1.1
2.0.0
```

---

# Version Meaning

## Major

Breaking template behavior.

Examples:

- sender structure redesign
- parser engine contract changes
- new template schema

Examples:

```txt id="h2n5re"
1.x.x → 2.x.x
```

Requires compatibility validation.

---

## Minor

Backward-compatible template expansion.

Examples:

- new bank support
- new sender support
- new categorization rules

Examples:

```txt id="v8c6ly"
1.1.0 → 1.2.0
```

---

## Patch

Backward-compatible fixes.

Examples:

- typo correction
- regex fix
- sender alias fix

Examples:

```txt id="d3r9kw"
1.1.0 → 1.1.1
```

---

# Client Fetch Policy

Mobile clients must fetch templates every:

```txt id="p9e4sx"
24 hours
```

Fetch occurs in background.

Allowed triggers:

- app launch
- scheduled background sync
- manual refresh in settings

Clients must never fetch more frequently than once per 24-hour window unless manually triggered.

---

# Client Fetch Behavior

## Step 1

Read local template version.

## Step 2

Call Edge Function.

Send only:

- app version
- platform
- current template version

## Step 3

Edge Function compares versions.

## Step 4

If newer version exists:

download package.

## Step 5

Validate package.

## Step 6

Activate package.

---

# Local Cache Policy

Templates must always be cached locally.

Templates are stored:

- encrypted
- version tagged
- checksum verified

Local cache survives:

- app restart
- device reboot
- offline usage

Templates must not require network connectivity after download.

---

# Offline Behavior

If device is offline:

Client must use cached templates.

Parsing must continue normally.

The user must never see:

- update errors
- connectivity errors
- parser interruption

Offline operation is mandatory.

---

# Cache Invalidation Strategy

Template cache must be invalidated only when:

## Case 1

A newer version is available.

## Case 2

Local checksum fails.

## Case 3

Local cache corruption detected.

## Case 4

User manually requests refresh.

---

# Cache Replacement Rules

New templates must never overwrite active templates until validation succeeds.

Required flow:

## Step 1

Download new package.

## Step 2

Validate checksum.

## Step 3

Validate schema.

## Step 4

Activate new version.

## Step 5

Archive previous version.

Only then may cache be updated.

---

# Cache Retention Policy

Client must retain:

- active version
- previous version

Example:

```txt id="j8m2cx"
current
previous
```

Older versions may be discarded.

Maximum retained versions:

```txt id="u5q7nl"
2
```

---

# Rollback Strategy

Rollback is supported only for templates.

Rollback is not supported for database schema.

---

# Automatic Rollback

Rollback triggers:

## Case 1

Template validation failure.

## Case 2

 Parser crash spike.

## Case 3

Unrecognized template schema.

## Case 4

Critical parsing regression.

---

# Rollback Flow

## Step 1

Deactivate current template.

## Step 2

Restore previous cached version.

## Step 3

Mark failed version as blocked.

## Step 4

Report template failure metadata.

No raw content is transmitted.

Allowed metadata:

- template version
- sender identifier
- parse failure code
- platform
- app version

---

# Server-Side Rollback

Edge Functions may mark any template version as:

```txt id="s3v8ky"
deprecated
blocked
rollback_required
```

Clients fetching blocked versions must automatically downgrade to the last stable version.

---

# Integrity Validation

Every template package must include:

## Version Identifier

Example:

```txt id="n6w1af"
1.2.4
```

## Schema Identifier

Example:

```txt id="b4r7po"
template_schema_v1
```

## Checksum

Used for corruption detection.

## Created Timestamp

Used for auditing.

---

# Security Rules

Template service must never:

- accept raw SMS uploads
- accept raw email uploads
- accept screenshots
- accept transaction payload uploads

Template service may only expose:

- template metadata
- version metadata
- checksum metadata
- compatibility metadata

---

# Compatibility Rules

Templates must declare compatible app versions.

Example:

```txt id="x9c5me"
app >= 1.0.0
app < 2.0.0
```

Incompatible templates must never be activated.

---

# Failure Behavior

If template fetch fails:

Use cached templates.

If cache validation fails:

Use previous cached templates.

If no cache exists:

Use bundled app templates.

Parsing must never stop.

User must never lose transaction capture due to template delivery failure.

---

# Non-Negotiable Rules

These rules may never be broken:

- raw SMS content is never transmitted
- raw email content is never transmitted
- parsing always happens on-device
- templates are versioned
- clients fetch every 24 hours
- templates are cached locally
- offline fallback is mandatory
- previous version is always retained
- template activation happens only after validation
- rollback must never require user action