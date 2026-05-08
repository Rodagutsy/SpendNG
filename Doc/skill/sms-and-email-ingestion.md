---
name: spendng-sms-email-ingestion
description: Complete rules for SpendNG's SMS and email ingestion layer — the core data capture engine. Use this skill before building or modifying anything related to SMS reading, email polling, background services, transaction parsing, duplicate detection, or supported sender handling. Triggers for any work on the ingestion pipeline, parser templates, background service, or alert processing.
---

# SpendNG SMS and Email Ingestion

This skill defines the complete ingestion pipeline — how raw alerts become transaction records.
This is the most critical layer of SpendNG. Every other feature depends on this working correctly.

---

## 1. SMS Ingestion (Android)

### 1.1 Background Service

Use `react-native-sms-retriever` for real-time SMS monitoring combined with a one-time historical inbox scan.

The service must be registered as an Android Foreground Service to survive aggressive battery management on MIUI, ColorOS, EMUI, and other OEM Android skins.

**Required persistent notification (cannot be removed):**
```
Title: SpendNG
Body: Watching for new transactions
Icon: SpendNG app icon (small, monochrome)
Priority: LOW — collapsed by default, not intrusive
```

**Rule:** The persistent notification is an Android system requirement for foreground services. Never attempt to suppress or hide it. The copy must communicate value, not feel like system overhead.

### 1.2 Historical Inbox Scan

On first SMS permission grant, scan the full SMS inbox in reverse chronological order (newest first). Process in background. The UI must remain fully usable during this scan.

Show progress on the onboarding import screen:
- Number of alerts identified so far
- Number successfully parsed
- Estimated time remaining (based on current processing rate)

**Rule:** The scan must be resumable. If interrupted (app backgrounded or killed), resume from the last processed message ID on next open — never restart from scratch.

### 1.3 Sender Identification

Before attempting to parse any SMS, validate the sender against the known sender list. Messages from unrecognized senders are discarded immediately without parsing.

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

**Unrecognized senders:** Store in a `pending_review` queue with the raw message hash and sender ID. Do not parse. Surface in a "Help improve SpendNG" section in Settings where users can identify their bank. Use this data to prioritize new sender support.

### 1.4 Real-Time SMS Monitoring

Register a `BroadcastReceiver` for `android.provider.Telephony.SMS_RECEIVED`. Process each incoming message through the sender filter immediately. If from a recognized sender, parse immediately and commit the transaction within 5 seconds of receipt.

---

## 2. Email Ingestion (Both Platforms)

### 2.1 OAuth Connection

Present Gmail and Outlook connection during onboarding as strongly recommended but optional. Use the following OAuth scopes — never request broader access:

- Gmail: `https://www.googleapis.com/auth/gmail.readonly`
- Outlook: `Mail.Read`

Store tokens in device keychain only (see `spendng-security-guardrails`).

### 2.2 Historical Email Scan

On first OAuth connection, scan the inbox filtered by known financial sender addresses. Process in reverse chronological order (newest first). Run in background. The UI must be fully usable during this scan.

**Email filter query for Gmail:**
```
from:(alerts@gtbank.com OR notifications@kuda.co OR alerts@opay.africa OR 
      hello@grey.co OR notifications@geegpay.com OR transfers@lemfi.com OR 
      noreply@piggyvest.com OR hello@cowrywise.com OR 
      notifications@flutterwave.com OR notifications@paystack.com)
```

Build the equivalent filter for Outlook using the same sender list.

### 2.3 Polling Service

Use `react-native-background-fetch` to poll for new emails at a default interval of 15 minutes. Make this configurable in Settings between 5 minutes and 1 hour.

On each poll:
1. Fetch emails received since the last successful poll timestamp
2. Filter by recognized sender addresses
3. For each matching email, pass to parser
4. Update the last-poll timestamp on success

**Rule:** If the device is offline, skip the poll silently. Do not queue poll attempts — simply poll at the next scheduled interval when connectivity is restored.

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
| Piggyvest | noreply@piggyvest.com |
| Cowrywise | hello@cowrywise.com |
| Flutterwave | notifications@flutterwave.com |
| Paystack | notifications@paystack.com |

---

## 3. Transaction Parser

### 3.1 Parser Architecture

The parser is a JavaScript engine that runs entirely on-device. It uses a library of sender-specific templates. Each template defines:

- Regex patterns for each field
- Field positions and delimiters
- Currency symbol formats for that sender
- Date format patterns for that sender
- Expected transaction type indicators (debit keywords, credit keywords)

Templates are bundled with the app and updated via Expo EAS OTA updates — no full App Store release needed to add new bank support.

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

The parser must recognize and normalize all of the following as equivalent to `1000.00 NGN`:

```
₦1,000.00
₦1000
NGN 1,000.00
NGN1000.00
1,000.00 naira
1000 Naira
N1,000.00
1,000NGN
```

**Rule:** Always strip commas, currency symbols, and whitespace before parsing the numeric value. Parse as float with 2 decimal places. If the amount cannot be parsed as a positive number, treat as parse failure.

### 3.5 Date Normalization

The parser must handle all of the following date formats:

```
27/04/2025          → DD/MM/YYYY
04/27/2025          → MM/DD/YYYY (rare but used by some platforms)
27-Apr-2025         → DD-Mon-YYYY
April 27, 2025      → Month DD, YYYY
27 Apr 2025         → DD Mon YYYY
2025-04-27          → ISO 8601
27/04/25            → DD/MM/YY
Today               → Current date
```

Always store as Unix timestamp in the database. Always display as the user's local date format in the UI.

### 3.6 Transaction Type Detection

**Debit indicators (case-insensitive):**
`debit`, `debited`, `withdrawal`, `payment`, `purchase`, `sent`, `charged`, `spent`, `deducted`

**Credit indicators (case-insensitive):**
`credit`, `credited`, `received`, `deposit`, `transfer in`, `inflow`, `income`

If both indicators are present (unusual but possible), prefer the more specific term. If neither is found, attempt to infer from context: if a merchant name is present and no direction indicator exists, classify as debit.

### 3.7 Duplicate Detection

Before committing any transaction, check for an existing record matching all three:
- `amount` within ±0.01
- `transaction_date` within a 5-minute window
- `account_name` matches (or both are null)

If all three match, classify as duplicate. Do not commit. Log in `sync_logs` with `parse_status: 'duplicate'` and a reference to the original record ID.

**Rule:** False positive duplicate suppression is recoverable via manual entry. An actual duplicate appearing in the transaction list is a worse user experience than a suppressed legitimate transaction. Err on the side of deduplication.

---

## 4. Failed Parse Handling

When a parse fails:

1. Do **not** create a transaction record
2. Do **not** show any error or broken record in the UI
3. Create a `sync_logs` entry with `parse_status: 'failed'` and the failure reason
4. Create a `failed_parses` entry with sender identifier and failure reason (no raw content on device)
5. Send the failure metadata (not raw content) to Supabase asynchronously for pattern analysis
6. The user never sees a failed parse unless they navigate to Settings → Data Sources → View Failed Alerts

---

## 5. Background Service Survival (Android)

These OEM Android skins aggressively kill background services. Address each one:

**MIUI (Xiaomi):**
- Prompt user to enable "Autostart" for SpendNG in MIUI Settings → Manage Apps
- Prompt user to set battery optimization to "No restriction"
- Show this prompt once during onboarding and once if SMS ingestion has been silent for 72 hours

**ColorOS (OPPO/Realme):**
- Prompt user to enable "Allow Auto Launch"
- Prompt user to enable "Allow running in background"

**EMUI (Huawei):**
- Prompt user to add SpendNG to "Protected Apps" list

**Samsung One UI:**
- Generally permissive but prompt if battery optimization is set to "Restricted"

**Implementation:** Detect the device manufacturer and model at runtime. If the device matches a known aggressive OEM, show the appropriate setup prompt during onboarding after SMS permission is granted. Store a flag so the prompt is shown at most once during onboarding and once per 30-day period if ingestion appears inactive.

---

## 6. iOS Constraints

On iOS, background SMS reading is not permitted by the operating system. This is not a bug or a limitation to work around — it is a platform policy.

**iOS ingestion strategy:**
- Email ingestion via OAuth is the primary channel on iOS
- Manual entry is the fallback for SMS-only banks
- During onboarding on iOS, the SMS permission screen is never shown
- The onboarding value explanation for iOS users emphasizes email connection

**Rule:** Never attempt to use any iOS API or third-party library to read SMS on iOS in a way that violates App Store guidelines. Rejection from the App Store is a worse outcome than limited functionality on iOS.