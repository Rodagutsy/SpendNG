# SpendNG — Testing Strategy (testing.md)

## 1. Overview

This document defines the testing strategy for SpendNG across mobile clients, backend services, ingestion pipelines, and data integrity layers.

SpendNG is a financial data system, not a typical consumer app. Testing therefore prioritizes:

- Data correctness over UI correctness
- Deterministic parsing accuracy over visual regression
- Edge-case resilience over feature coverage
- Offline reliability over network assumptions

---

## 2. Testing Philosophy

SpendNG follows four core testing principles:

1. **Financial correctness is non-negotiable**
   - A wrong transaction is worse than a crash.

2. **Real-world data variability is the primary risk**
   - Nigerian SMS/email formats are inconsistent and must drive test design.

3. **On-device behavior is a first-class test surface**
   - Most failures will occur outside the backend.

4. **Silent failures are unacceptable**
   - Every ingestion failure must be observable in logs.

---

## 3. Test Layers

---

## 3.1 Unit Testing

### Scope
Individual functions and modules.

### Coverage Areas
- SMS parsing functions
- Email parsing functions
- Categorization rule engine
- Duplicate detection logic
- Currency normalization
- Date parsing utilities

### Requirements
- 90%+ coverage for parsing and categorization modules
- Deterministic outputs only
- No external API calls

### Tools
- Jest (primary)
- React Native Testing Library (utility layer)

---

## 3.2 Integration Testing

### Scope
Interaction between system components.

### Key Flows Tested

- SMS ingestion → parser → transaction creation
- Email ingestion → parser → transaction creation
- Categorization → rule engine → DB persistence
- Duplicate detection across ingestion sources
- Manual entry → dashboard updates

### Validation Criteria
- No transaction loss in pipeline
- Correct category assignment end-to-end
- Proper sync logging for all events

---

## 3.3 End-to-End (E2E) Testing

### Scope
Full user flows on real or simulated devices.

### Critical Flows

1. Onboarding flow with SMS + email permissions
2. First transaction capture (SMS → UI)
3. Multi-bank ingestion scenario
4. Search across large dataset
5. Export generation (PDF + CSV)
6. Manual transaction entry
7. Recategorization flow

### Tools
- Detox (React Native E2E testing)
- Real device testing on low-end Android hardware

---

## 3.4 Device Compatibility Testing

### Target Devices

- Low-end Android (2–3GB RAM)
- Mid-range Android (4–6GB RAM)
- iOS devices (iPhone 11 and above)
- Aggressive OEM skins:
  - MIUI
  - ColorOS
  - One UI (battery restrictions)

### Focus Areas

- SMS background service stability
- Battery optimization survival
- App restart persistence
- Local database performance

---

## 3.5 Parsing Accuracy Testing

### Purpose
Validate correctness of financial extraction logic.

### Methodology

- Collect real anonymized SMS/email samples
- Tag expected outputs manually
- Compare parser output vs expected structure

### Metrics

- Amount extraction accuracy
- Merchant name accuracy
- Transaction type accuracy
- Date normalization accuracy

### Target
- ≥ 90% accuracy per supported sender
- ≥ 85% for newly added sender templates (initial rollout threshold)

---

## 3.6 Categorization Testing

### Scope
Rule engine correctness.

### Test Cases

- Exact merchant matches
- Partial keyword matches
- Conflicting rules
- User overrides
- Unknown merchants fallback behavior

### Validation

- Category stability over repeated runs
- No cross-category drift for identical inputs
- Correct priority resolution

---

## 3.7 Performance Testing

### Key Metrics

| Area                | Target                          |
|---------------------|---------------------------------|
| Search latency      | < 2 seconds (50k+ records)      |
| Dashboard load      | < 1.5 seconds                   |
| Transaction insert  | < 500ms local write            |
| Export generation   | < 15 seconds (1-year dataset)   |

### Stress Conditions

- 100k+ transaction dataset
- Offline mode for extended periods
- Background ingestion bursts

---

## 3.8 Offline Mode Testing

### Scope
Full app functionality without internet.

### Must Work Offline

- SMS ingestion
- Transaction parsing
- Categorization
- Search
- Manual entry
- Dashboard rendering
- Local export generation

### Must Fail Gracefully Offline

- Email sync (queued)
- Cloud sync (paused)
- OAuth refresh (disabled)

---

## 3.9 Security Testing

### Areas Covered

- JWT session integrity
- RLS enforcement (Supabase)
- Token storage security (Keychain/Keystore)
- SMS data isolation
- Email content filtering

### Test Cases

- Attempt cross-user data access via API manipulation
- Verify RLS blocks unauthorized queries
- Validate encryption of sensitive fields
- Ensure raw SMS is never transmitted to backend

---

## 3.10 Regression Testing

### Trigger Conditions

- New bank parser added
- Categorization rules updated
- SMS parsing templates modified
- Database schema changes
- OTA update deployment

### Strategy

- Re-run full ingestion pipeline on test dataset
- Compare output snapshots
- Validate no historical parsing regressions

---

## 4. Test Data Strategy

### Sources

- Anonymized real SMS alerts
- Simulated bank templates
- Edge-case malformed messages
- Multi-language samples (English + partial local language noise)

### Categories of Test Data

- Standard transactions
- Split SMS messages
- Failed transactions
- Duplicate alerts
- Multi-currency transactions
- International payment alerts

---

## 5. Monitoring in Production

Testing does not stop at release.

### Production Monitoring Includes:

- Parsing success rate by sender
- Failed parse volume
- Duplicate detection rate
- Sync log error frequency
- Device-specific ingestion failures

### Alert Thresholds

- Parsing accuracy drops below 85%
- Failed parse spike > 20% in 24 hours
- SMS ingestion silence > 72 hours per active user
- Email sync failure rate > 10%

---

## 6. QA Acceptance Criteria

A release is considered valid only if:

- No critical ingestion failures in core banks (GTBank, Access, Zenith, UBA, Kuda, Opay)
- Parsing accuracy ≥ 90% on regression dataset
- No data loss detected in transaction pipeline
- Export correctness verified against raw dataset
- No RLS violations detected in security tests

---

## 7. Known Testing Risks

- SMS formats vary by bank and may change without notice
- Android OEM background restrictions can invalidate lab results
- Email provider rate limits may not replicate in staging
- Low-end devices may behave unpredictably under load

---

## 8. Summary

Testing SpendNG is fundamentally about one objective:

> Ensuring that every financial alert becomes a correct, retrievable, and verifiable transaction record.

Everything else is secondary to that guarantee.