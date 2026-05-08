# SpendNG — Agent Specification (agent.md)

## 1. Overview

SpendNG uses a lightweight agent system to coordinate ingestion, parsing, categorization, and insight generation from transaction alerts.

Despite the terminology, this is not a fully autonomous AI system. The core system is deterministic and rule-based. “Agents” in this context refer to modular processing components that operate on structured financial data.

The design prioritizes:
- Predictability over probabilistic behavior
- On-device processing where possible
- Strict data minimization
- Deterministic outputs for financial accuracy

---

## 2. Agent Architecture

SpendNG is composed of four primary agents:

1. Ingestion Agent
2. Parsing Agent
3. Categorization Agent
4. Insight Agent

Each agent operates independently but follows a strict sequential pipeline.

---

## 3. Ingestion Agent

### 3.1 Purpose
Detect and collect transaction-related data from SMS and email sources.

### 3.2 Inputs
- Incoming SMS messages (Android foreground/background service)
- Email messages via OAuth-connected accounts (Gmail, Outlook)

### 3.3 Responsibilities
- Filter messages by known financial senders
- Discard non-financial content
- Forward valid messages to Parsing Agent

### 3.4 Constraints
- Must not transmit raw message content to backend systems
- Must operate on-device only
- Must not infer transaction details beyond sender classification

### 3.5 Output
- Raw transaction alert payload (SMS/email text + metadata)

---

## 4. Parsing Agent

### 4.1 Purpose
Convert raw financial alerts into structured transaction records.

### 4.2 Inputs
- Raw SMS or email content
- Sender identifier
- Predefined parsing templates

### 4.3 Processing Model
The parsing agent is deterministic and template-driven:

1. Identify sender
2. Load corresponding parsing template
3. Apply extraction rules (regex + positional parsing)
4. Normalize extracted values
5. Validate required fields

### 4.4 Extracted Fields
- Amount
- Currency
- Transaction type (credit/debit)
- Merchant or sender name
- Timestamp
- Account reference (if available)
- Available balance (optional)
- Raw source text

### 4.5 Failure Handling
If parsing fails:
- Store message in `failed_parses`
- Assign failure reason
- Do not generate transaction record

### 4.6 Optional LLM Assistance (Controlled Use)
A language model may be used only for:
- Suggesting parsing templates for new unsupported banks
- Assisting debugging of failed parse logs
- NOT for production transaction creation without validation

---

## 5. Categorization Agent

### 5.1 Purpose
Assign each transaction to a predefined financial category.

### 5.2 Inputs
- Structured transaction record
- Merchant name
- Transaction type
- Existing rule set

### 5.3 Methodology
Categorization is rule-based:

Priority order:
1. Exact merchant match
2. Keyword/contains match
3. Pattern-based rules (amount ranges, transaction type)
4. Fallback: Uncategorized

### 5.4 Categories (System Default)
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

### 5.5 Learning Mechanism
- User overrides update local rules
- Rules are stored per user
- Future transactions inherit updated mappings

### 5.6 Failure Mode
If rule engine fails:
- Default to transaction-type categorization:
  - Debit → Transfers Sent
  - Credit → Transfers Received
- Flag transaction for review

---

## 6. Insight Agent

### 6.1 Purpose
Generate summaries and insights from transaction history.

### 6.2 Scope (Version 1 Limited)
The Insight Agent does NOT perform financial advice or forecasting.

It only produces:
- Monthly spending summaries
- Category breakdowns
- Income vs expense totals
- Simple comparisons (month-over-month)

### 6.3 Inputs
- Aggregated transaction data
- Time range filters
- Category groupings

### 6.4 Outputs
- Structured summary objects
- Dashboard metrics
- Export-ready aggregates

### 6.5 Constraints
- No predictive modeling
- No budgeting recommendations
- No investment suggestions
- No behavioral judgment language

---

## 7. Agent Execution Pipeline

All transactions follow a strict pipeline:

1. Ingestion Agent captures alert
2. Parsing Agent structures transaction
3. Categorization Agent assigns category
4. Insight Agent aggregates for UI consumption

Pipeline is linear and non-branching in version 1.

---

## 8. Data Access Rules

### 8.1 On-Device First Principle
- SMS and email content processed locally
- Only structured outputs are synced to backend

### 8.2 Backend Access
Backend systems only receive:
- Parsed transactions
- Categories
- Aggregated summaries
- Sync logs

Never:
- Raw SMS inbox
- Non-financial email content
- Unparsed message content (except failed parse logs)

---

## 9. Error Handling Model

Each agent must explicitly handle failure states:

### 9.1 Ingestion Failures
- Permission denied → disable ingestion gracefully
- Background service killed → prompt user remediation

### 9.2 Parsing Failures
- Missing required fields → log to `failed_parses`
- Duplicate detection → suppress silently

### 9.3 Categorization Failures
- Missing rule match → fallback category applied
- Rule conflict → require user resolution

### 9.4 Insight Failures
- Missing data → return empty aggregates, not errors

---

## 10. Observability

Each agent must emit structured logs to `sync_logs`:

### Required Fields
- Agent type
- Input source
- Processing outcome
- Timestamp
- Failure reason (if any)

These logs are used for:
- Debugging parser issues
- Expanding sender coverage
- Monitoring system reliability

---

## 11. Security Constraints

- No agent is allowed to transmit raw SMS/email content externally
- All sensitive parsing must occur on-device
- OAuth tokens are never exposed to agents beyond authorized scopes
- Agents must respect Row-Level Security boundaries implicitly enforced by backend

---

## 12. Non-Goals

The agent system explicitly does not include:

- Autonomous financial decision-making
- Natural language financial advice
- Chat-based assistant interface (version 1)
- Cross-user learning or shared intelligence
- Predictive income or spending models

---

## 13. Summary

SpendNG agents are not autonomous AI entities. They are deterministic processing modules designed to transform raw financial alerts into structured, usable financial records.

The system is intentionally conservative: correctness, auditability, and privacy are prioritized over intelligence or flexibility.