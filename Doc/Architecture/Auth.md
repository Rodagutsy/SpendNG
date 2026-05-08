# SpendNG — Authentication Specification (auth.md)

## 1. Overview

This document defines the authentication system for SpendNG. The system is designed to be simple for end users while maintaining strong security guarantees appropriate for sensitive financial data.

Authentication is handled primarily through Supabase Auth, with support for email/password and Google OAuth. Device-level protection (PIN or biometric lock) is implemented separately as an application security layer, not as part of authentication itself.

---

## 2. Authentication Provider

- **Primary backend:** Supabase Auth
- **Session format:** JWT (managed by Supabase)
- **Token refresh:** Automatic refresh via Supabase SDK
- **Database security:** Row-Level Security (RLS) enforced on all tables

All user data access is scoped strictly to authenticated user sessions.

---

## 3. Supported Authentication Methods

### 3.1 Email and Password
- Standard email/password registration and login
- Passwords stored as bcrypt hashes via Supabase Auth
- Email uniqueness enforced at database level

### 3.2 Google OAuth
- OAuth sign-in via Google
- Access limited to identity verification and email retrieval
- No access to unrelated Google data (e.g., Drive, Contacts)

### 3.3 Optional Phone Number
- Phone number may be collected during signup
- Not used as a primary authentication factor in version 1
- Must remain unique if provided

---

## 4. Registration Flow

### 4.1 Email Signup Flow
1. User enters email and password
2. System validates email format and password strength
3. Supabase creates user record
4. Email verification is triggered (if enabled)
5. User is issued JWT session token upon successful verification or immediate login (depending on config)

### 4.2 Google OAuth Flow
1. User selects "Continue with Google"
2. Redirect to Google consent screen
3. User grants access
4. Supabase receives OAuth callback
5. User account is created or linked
6. Session token is issued

---

## 5. Login Flow

### Email Login
1. User submits email and password
2. Supabase Auth validates credentials
3. JWT access and refresh tokens are issued
4. Session is persisted locally on device

### OAuth Login
1. User selects Google login
2. OAuth flow completes
3. Existing account is matched by email or new account is created
4. Session is issued

---

## 6. Session Management

- Sessions are JWT-based
- Access tokens are short-lived
- Refresh tokens are used for silent re-authentication
- Tokens are stored securely using:
  - iOS Keychain
  - Android Keystore

### Session Rules
- Sessions persist across app restarts
- Sessions expire automatically if refresh token becomes invalid
- Re-authentication is required after logout or token revocation

---

## 7. Application-Level Security (App Lock)

This is separate from authentication.

### 7.1 PIN / Biometric Lock
- User can enable PIN or biometric lock (Face ID / Fingerprint)
- Used to unlock the app after it has already been authenticated
- Does not replace Supabase authentication

### 7.2 Behavior
- Triggered on app foreground
- Bypassed only if disabled in settings
- Stored locally on device only

---

## 8. Password Requirements

- Minimum 8 characters
- Must include at least:
  - One numeric character
  - One letter
- No forced complexity beyond this in version 1
- Password reset handled via email link through Supabase

---

## 9. Account Recovery

### Password Reset
1. User requests password reset
2. Email link is sent via Supabase Auth
3. User sets new password via secure page
4. Previous sessions are invalidated (optional but recommended)

### OAuth Accounts
- Recovery handled via Google account recovery process
- SpendNG does not store or manage Google credentials

---

## 10. Security Model

### 10.1 Data Isolation
- All database queries are protected by Row-Level Security (RLS)
- Users can only access records where `user_id = auth.uid()`

### 10.2 Token Storage
- Never stored in plaintext
- Stored only in OS secure storage:
  - iOS Keychain
  - Android Keystore

### 10.3 Transport Security
- All API communication uses HTTPS (TLS 1.3 minimum)

### 10.4 SMS and Email Separation
- Authentication system has no access to raw SMS content
- SMS parsing runs independently on-device
- Only structured transaction data is synced post-authentication

---

## 11. Logout Behavior

On logout:
- JWT tokens are revoked locally
- Secure storage is cleared
- Cached transaction views remain locally but are locked
- User must re-authenticate to access cloud-synced data

---

## 12. Edge Cases

### 12.1 Token Expiration
- If refresh token fails:
  - User is redirected to login screen
  - Local session state is cleared

### 12.2 Network Failure During Login
- Authentication attempts are retried once
- If failure persists, user is shown offline error state

### 12.3 Multiple Device Login
- Allowed in version 1
- Each device maintains independent session
- Revoking session on one device does not affect others unless global logout is triggered

### 12.4 Deleted Account
- All sessions immediately invalidated
- User data access permanently blocked via RLS
- Data marked for deletion according to retention policy

---

## 13. Non-Goals (Version 1)

The following are explicitly excluded from authentication scope:

- Multi-factor authentication (SMS OTP, authenticator apps)
- Enterprise SSO (SAML, Okta)
- Shared accounts or role-based access control
- Account delegation or family linking

---

## 14. Summary

SpendNG authentication is intentionally minimal: email/password and Google OAuth backed by Supabase Auth. Security is enforced through JWT sessions, secure OS-level token storage, and strict Row-Level Security policies.

Complex identity systems are deferred until there is a proven need at scale.