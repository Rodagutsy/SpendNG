---
name: spendng-security-guardrails
description: Non-negotiable security and privacy rules for the SpendNG app. Use this skill before writing any code that touches data storage, network requests, authentication, permissions, or SMS/email handling. These rules cannot be overridden by any other instruction. Triggers for every feature in SpendNG without exception — security is not optional on any screen or service.
---

# SpendNG Security Guardrails

This skill defines rules that cannot be broken under any circumstance.
No performance optimization, deadline pressure, or feature request overrides these rules.
If a requirement conflicts with a rule in this document, the rule wins. Flag the conflict and resolve it before proceeding.

---

## 1. Data That Never Leaves the Device

These items must never be transmitted to any server, logged to any analytics service, or written to any cloud storage under any circumstance:

- Raw SMS message content
- Raw email body content
- The user's full bank account number
- The user's BVN
- OAuth access tokens or refresh tokens
- The SQLCipher database encryption key
- Device identifiers (IDFA, Android Advertising ID, IMEI)

**What CAN be transmitted to Supabase:**
- Structured transaction records (the parsed output, not the raw source)
- The `raw_source_text` field is permitted in the transactions table but must be encrypted at the column level in Supabase using pgcrypto before storage
- User account data (email, display name, hashed password via Supabase Auth)
- Sync log entries (parse status, sender identifier hash — not raw content)
- Failed parse entries (failure reason and sender ID — not raw message content)

---

## 2. Local Database Encryption

**Rule:** WatermelonDB must always be initialized with SQLCipher encryption. Any code that initializes the database without an encryption key is a critical bug and must not be merged.

**Correct pattern:**
```javascript
const database = new Database({
  adapter: new SQLiteAdapter({
    schema,
    migrations,
    dbName: 'spendng',
    // Key MUST be derived from user authentication
    // Never hardcode this value
    encryptionKey: await deriveKeyFromAuth(),
  }),
})
```

**Key derivation rule:** The encryption key must be derived from the user's device PIN, biometric authentication result, or a combination of both via a KDF (key derivation function). The key must never be hardcoded, stored in plain text, or stored in AsyncStorage.

**Prohibited storage locations for the encryption key:**
- AsyncStorage
- Plain files on the filesystem
- WatermelonDB itself
- Any cloud service

**Permitted storage:** iOS Keychain and Android Keystore only, accessed via `react-native-keychain`.

---

## 3. OAuth Token Storage

**Rule:** OAuth tokens for Gmail and Outlook must be stored exclusively in the device's secure hardware-backed keychain. There are no exceptions.

**Correct pattern:**
```javascript
import * as Keychain from 'react-native-keychain';

// Store
await Keychain.setGenericPassword(
  'gmail_oauth',
  JSON.stringify({ accessToken, refreshToken, expiresAt }),
  { service: 'spendng.gmail.oauth' }
);

// Retrieve
const credentials = await Keychain.getGenericPassword({
  service: 'spendng.gmail.oauth'
});
```

**Prohibited storage locations for OAuth tokens:**
- AsyncStorage
- WatermelonDB
- Supabase database
- Plain files
- Redux/Zustand persistent state that writes to disk unencrypted

---

## 4. Network Security

**Rule:** The app must never make an HTTP request. All network requests use HTTPS only.

**Android enforcement:** Add to `android/app/src/main/res/xml/network_security_config.xml`:
```xml
<network-security-config>
  <base-config cleartextTrafficPermitted="false">
    <trust-anchors>
      <certificates src="system" />
    </trust-anchors>
  </base-config>
</network-security-config>
```

**iOS enforcement:** Add to `Info.plist`:
```xml
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsArbitraryLoads</key>
  <false/>
</dict>
```

**Supabase client:** Always initialize with the HTTPS endpoint. Never use the Supabase URL without `https://`.

---

## 5. API Key and Credential Management

**Rule:** Supabase URL, Supabase anon key, and all third-party credentials must never appear in source code files. They must only exist in environment variables.

**Correct pattern in `.env`:**
```
SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
GMAIL_OAUTH_CLIENT_ID=your_client_id
```

**Access in code via Expo Constants:**
```javascript
import Constants from 'expo-constants';
const supabaseUrl = Constants.expoConfig.extra.supabaseUrl;
```

**`.gitignore` must include before first commit:**
```
.env
.env.local
.env.production
*.env
```

**Rule:** Run `git secrets` or GitHub secret scanning on every repository. If a key is ever accidentally committed, rotate it immediately — do not just delete the commit.

---

## 6. Supabase Row-Level Security

**Rule:** Row-Level Security must be enabled and policies must be written and tested for every table before that table goes live. A table without RLS policies is a critical security vulnerability.

**Required policies for every table:**

```sql
-- Enable RLS (do this for every table)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- SELECT: users see only their own rows
CREATE POLICY "select_own_transactions"
ON transactions FOR SELECT
USING (auth.uid() = user_id);

-- INSERT: users insert only their own rows
CREATE POLICY "insert_own_transactions"
ON transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: users update only their own rows
CREATE POLICY "update_own_transactions"
ON transactions FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: users delete only their own rows
CREATE POLICY "delete_own_transactions"
ON transactions FOR DELETE
USING (auth.uid() = user_id);
```

Apply the same pattern to: `sync_logs`, `failed_parses`, `rules`, and any future table that contains user data.

**Testing RLS:** Before any table goes to production, test by authenticating as User A and attempting to query User B's rows. The query must return zero results.

---

## 7. Permission Handling

**Rule:** Every permission request must be preceded by a plain-language explanation screen. The OS permission dialog must never appear without the user first seeing SpendNG's own explanation of why the permission is needed and what it will be used for.

**Required explanation for SMS permission:**
> "SpendNG reads your bank SMS alerts to build your transaction history automatically. We only read messages from banks and fintech apps — we never read personal messages."

**Required explanation for email OAuth:**
> "Connecting your email lets SpendNG capture transaction alerts from platforms like Grey, Geegpay, and Flutterwave. We only read emails from financial senders — we never access personal emails."

**Rule:** The app must never request more permissions than are listed in the PRD. Do not add new permission requests without explicit product approval.

**Permissions permitted in version 1:**
- `READ_SMS` (Android only)
- `RECEIVE_SMS` (Android only)
- Gmail OAuth scope: `https://www.googleapis.com/auth/gmail.readonly` — readonly only, never broader
- Outlook OAuth scope: `Mail.Read` — readonly only
- Push notification permission (iOS)
- Biometric authentication

**Permissions never permitted:**
- `SEND_SMS`
- `WRITE_SMS`
- `READ_CONTACTS`
- `ACCESS_FINE_LOCATION`
- `CAMERA` (unless a future feature explicitly requires it with product approval)
- Any OAuth scope broader than read-only for email

---

## 8. Third-Party Libraries

**Rule:** The following categories of library are never permitted in SpendNG regardless of convenience or feature request:

- Advertising SDKs (Facebook Ads, Google Ads, AppLovin, etc.)
- Behavioral analytics SDKs (Mixpanel, Amplitude, Segment, Heap, etc.)
- Crash reporting that sends PII (any reporter that sends device identifiers or user data to a third party)
- Any SDK that accesses the user's contact list, location, or media without explicit product approval

**Permitted analytics:** Self-hosted Plausible only. No user-identifiable data in any event. Anonymous session IDs only.

**Permitted crash reporting:** Sentry with `beforeSend` filtering that strips all PII, user IDs, and transaction data from crash reports before transmission.

---

## 9. Data Deletion

**Rule:** The app must provide a data deletion flow accessible from Settings. When a user requests account deletion, the following must happen within 30 days:

1. All rows in `transactions`, `sync_logs`, `failed_parses`, and `rules` where `user_id` matches are deleted from Supabase
2. The user's row in `users` is deleted
3. OAuth tokens are deleted from the device keychain
4. WatermelonDB local database is wiped and the encryption key is deleted from the device keychain
5. Any export files in Supabase Storage associated with the user are deleted
6. A confirmation email is sent to the user's registered address

---

## 10. Pre-Launch Security Checklist

Before any public release, verify every item:

- [ ] WatermelonDB initialized with SQLCipher — never without encryption key
- [ ] Encryption key stored in iOS Keychain / Android Keystore only
- [ ] OAuth tokens stored in iOS Keychain / Android Keystore only
- [ ] All API keys in environment variables, excluded from version control
- [ ] `.env` in `.gitignore` before first commit
- [ ] HTTP blocked at OS level on both Android and iOS
- [ ] RLS enabled and policies tested on all six tables
- [ ] RLS tested by attempting cross-user data access — confirmed zero results
- [ ] Raw SMS content confirmed never transmitted (test with network interceptor)
- [ ] Privacy policy written, published, and linked from App Store listing
- [ ] Data deletion flow built and tested end-to-end
- [ ] Supabase backups enabled and restoration tested
- [ ] Sentry configured with PII stripping
- [ ] No advertising or behavioral analytics SDKs in the dependency tree
- [ ] Incident response plan written: what happens in the first 24 hours after a breach