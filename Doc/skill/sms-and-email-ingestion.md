---
name: spendng-sms-email-ingestion
description: Complete rules for SpendNG's SMS and email ingestion layer — the core data capture engine. Use this skill before building or modifying anything related to SMS reading, email polling, background services, transaction parsing, duplicate detection, or supported sender handling. Triggers for any work on the ingestion pipeline, parser templates, background service, or alert processing.
---

# SpendNG SMS and Email Ingestion

This skill defines the complete ingestion pipeline — how raw alerts become transaction records.
This is the most critical layer of SpendNG. Every other feature depends on this working correctly.

---

## 1. SMS Ingestion (Android)

### 1.1 Native Bridge

Uses a custom React Native native module (`SMSModule.kt`) with:
- `getInboxMessages()` — queries `content://sms/inbox` via `ContentResolver`, filters by transactional keywords (debit, credit, spent, received, etc.) to minimize overhead
- `SMSReceiver.kt` — `BroadcastReceiver` for `android.provider.Telephony.SMS_RECEIVED`, emits events to JS via `DeviceEventEmitter`
- `SMSPackage.kt` — registers both in the React Native bridge

### 1.2 SMS Service (`sms-service.ts`)

- `requestPermissions()` — requests `RECEIVE_SMS` and `READ_SMS` via `PermissionsAndroid`
- `startMonitoring()` — registers `NativeEventEmitter` listener on `onSMSReceived`, pipes incoming messages to `IngestionEngine.processAlert`
- `scanInbox()` — calls `SMSModule.getInboxMessages()`, iterates messages and delegates to `IngestionEngine.processAlert`

### 1.3 Sender Identification

Sender validation is handled by the parser (`Parser.identifyBank`) using regex patterns against known Nigerian bank sender IDs.

**Supported SMS Senders — Version 1 Launch:**

| Institution | Sender ID(s) |
|---|---|
| GTBank | GTBANK, GTB-ALERT, GTALERT |
| Access Bank | ACCESS, ACCSSBNK, ACCESSBNK |
| First Bank | FIRSTBANK, FBN-ALERT, FIRSTBNK |
| Zenith Bank | ZENITH, ZENITHBNK, ZENITHTHB |
| UBA | UBA, UBA-ALERT, UBAALERT |
| Fidelity Bank | FIDELITY, FIDBNK |
| Sterling Bank | STERLING, STERLNBK |
| Kuda | KUDA, KUDABANK |
| Opay | OPAY, OPAYNGERIA |
| Moniepoint | MONIEPOINT, MONIEPNT |
| PalmPay | PALMPAY |
| Wema Bank | WEMABANK, WEMA |

**Unrecognized senders:** Messages from unrecognized senders are discarded without parsing. They are not stored.

---

## 2. Email Ingestion (Gmail only)

### 2.1 OAuth Connection

Present Gmail connection during onboarding as strongly recommended but optional. Uses the following OAuth scope:

- Gmail: `https://www.googleapis.com/auth/gmail.readonly`

Uses `expo-auth-session/providers/google` with `useAuthRequest()`. The OAuth flow requires a Google Cloud project with the Gmail API enabled and a Web OAuth client ID.

**Redirect URIs registered in Google Cloud Console:**
- Expo Go (dev): `https://auth.expo.io/@YOUR_EXPO_USERNAME/spendng-app`
- Standalone/production: `spendngapp://oauth`

Tokens are stored in the device keychain via `react-native-keychain` using service name `spendng.gmail`.

### 2.2 Historical Email Scan

On first OAuth connection, triggers a one-time manual scan of the inbox filtered by known financial sender addresses (last 30 days). Processed sequentially. The UI shows progress after scan completes.

**Email filter query for Gmail:**
```
from:(alerts@gtbank.com OR alerts@accessbankplc.com OR alert@firstbanknigeria.com OR 
      alert@zenithbank.com OR alerts@ubagroup.com OR notifications@kuda.co OR 
      alerts@opay.africa OR hello@grey.co OR notifications@geegpay.com OR 
      transfers@lemfi.com)
```

Emails are fetched via the Gmail API:
1. `GET /gmail/v1/users/me/messages?q=<query>&maxResults=50` — search messages
2. `GET /gmail/v1/users/me/messages/{id}?format=full` — get full message with body

### 2.3 Polling

No background polling in V1. Email import is triggered manually via the onboarding flow or Settings → Connected Accounts.

### 2.4 Supported Email Senders — Version 1 Launch

| Platform | From Address |
|---|---|
| GTBank | alerts@gtbank.com |
| Access Bank | alerts@accessbankplc.com |
| First Bank | alert@firstbanknigeria.com |
| Zenith Bank | alert@zenithbank.com |
| UBA | alerts@ubagroup.com |
| Kuda | notifications@kuda.co |
| Opay | alerts@opay.africa |
| Grey | hello@grey.co |
| Geegpay | notifications@geegpay.com |
| Lemfi | transfers@lemfi.com |

---

## 3. Transaction Parser

### 3.1 Parser Architecture

The parser is a JavaScript engine that runs entirely on-device. It uses sender-specific regex templates for SMS parsing and generic keyword-based extraction for email parsing.

### 3.2 Required vs Optional Fields

**Required (transaction not created if any are missing):**
- `amount`
- `transaction_type` (credit or debit)
- `transaction_date`

**Optional (transaction created without them):**
- `merchant_name`
- `account_name`
- `account_number_last4`
- `available_balance`
- `currency` (defaults to NGN if not detected)

### 3.3 Parse Confidence Scoring

| Confidence | Condition |
|---|---|
| `high` | All required fields extracted cleanly by template match |
| `medium` | Required fields extracted but one or more optional fields missing |
| `low` | Required fields extracted using fallback heuristics, not template match |
| `failed` | One or more required fields could not be extracted — no record created |

### 3.4 Amount Normalization

The parser strips commas, currency symbols, and whitespace before parsing the numeric value. Parses as float with 2 decimal places. If the amount cannot be parsed as a positive number, treat as parse failure.

SMS amount extraction uses bank-specific regex patterns. Email amount extraction uses a generic `(?:NGN|₦|$|£|USD|GBP)\s*([\d,]+\.\d{2})` pattern.

### 3.5 Date Normalization

The parser handles multiple date formats including DD/MM/YYYY, DD-Mon-YYYY, ISO 8601, and bank-specific formats.

Always stored as Unix timestamp in the database. Always displayed as user's local date format in the UI.

### 3.6 Transaction Type Detection

**Debit indicators (case-insensitive):**
`debit`, `debited`, `withdrawal`, `payment`, `purchase`, `sent`, `charged`, `spent`, `deducted`

**Credit indicators (case-insensitive):**
`credit`, `credited`, `received`, `deposit`, `transfer in`, `inflow`, `income`

### 3.7 Duplicate Detection

Before committing any transaction, two checks run:

1. **Content hash check** — SHA-256 hash of the raw message body compared against `sync_logs.raw_content_hash`. If match found, classified as duplicate.
2. **Amount + Merchant + Time window check** — Same amount (exact match), same merchant name, within ±5 minutes. If match found, classified as duplicate and logged with `parse_status: 'duplicate'`.

**Rule:** False positive duplicate suppression is recoverable via manual entry. An actual duplicate appearing in the transaction list is a worse user experience than a suppressed legitimate transaction. Err on the side of deduplication.

---

## 4. Failed Parse Handling

When a parse fails:

1. Do **not** create a transaction record
2. Do **not** show any error or broken record in the UI
3. Create a `sync_logs` entry with `parse_status: 'failed'` and the failure reason
4. Create a `failed_parses` entry with sender identifier and failure reason
5. The user never sees a failed parse unless they navigate to Settings → Data Sources → View Failed Alerts

---

## 5. Connected Accounts UI

A "Connected Accounts" screen in Settings shows Gmail connection status with Connect/Disconnect buttons. Uses the same OAuth flow as onboarding.

---

## 6. iOS Constraints

On iOS, background SMS reading is not permitted by the operating system.

**iOS ingestion strategy:**
- Email ingestion via OAuth is the primary channel on iOS
- Manual entry is the fallback for SMS-only banks
- During onboarding on iOS, the SMS permission screen is never shown

**Rule:** Never attempt to use any iOS API or third-party library to read SMS on iOS in a way that violates App Store guidelines.
