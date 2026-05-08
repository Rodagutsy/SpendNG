---
name: spendng-error-handling
description: Complete error handling, empty state, loading state, and offline behavior rules for SpendNG. Use this skill before writing any error message, building any loading state, designing any empty screen, or handling any failure case. Every failure in SpendNG has a defined, user-friendly response — none are left to guesswork. Triggers for all error states, loading states, empty states, and offline handling in SpendNG.
---

# SpendNG Error Handling

Every error in SpendNG has a defined response.
No error code, stack trace, or technical message ever reaches the user.
Every failure state tells the user what happened and what they can do about it.

---

## 1. Error Message Rules (Non-Negotiable)

Every user-facing error message must satisfy all three of these:

1. **Plain language** — No error codes, no technical terms, no jargon. If you would not say it to a non-technical friend, rewrite it.
2. **Cause explanation** — One sentence explaining what went wrong in human terms.
3. **Recovery action** — At least one clear button or link that helps the user move forward.

**Banned phrases in error messages:**
- Any error code (403, 500, parse_error, null_pointer, etc.)
- "Something went wrong" with no further context
- "Unknown error"
- "Please try again" with no explanation of what to try again
- "Network error" alone with no guidance
- Any sentence containing the word "exception"

---

## 2. Specific Error Messages

### SMS Ingestion Errors

| Situation | User-facing message | Recovery action |
|---|---|---|
| SMS permission denied | "SpendNG needs SMS access to capture your bank alerts automatically. You can grant it in your phone settings." | Button: "Open Settings" |
| Background service killed | "SpendNG may have stopped monitoring SMS alerts. Tap to check." | Button: "Check now" — triggers service health check |
| Parser could not read an alert | "We couldn't read this alert. You can add this transaction manually." | Button: "Add manually" — opens ManualEntryModal |
| SMS from unsupported bank | "We don't support [Bank Name] yet. Tap to let us know and we'll add it." | Button: "Request support" — logs the sender for prioritization |

### Email Ingestion Errors

| Situation | User-facing message | Recovery action |
|---|---|---|
| OAuth token expired | "Your email connection has expired. Tap here to reconnect — it takes 10 seconds." | Button: "Reconnect" — triggers OAuth flow |
| OAuth flow failed | "We couldn't connect to your [Gmail/Outlook] account. This is usually a temporary issue." | Buttons: "Try again" / "Skip for now" |
| OAuth flow failed 3× | "We're having trouble connecting to [Gmail/Outlook]. This might be a settings issue on your account." | Button: "Get help" — opens help documentation |
| Email format not recognized | No user-facing message — logged silently for pattern improvement | None |
| Rate limit hit | No user-facing message — retry automatically in background | None — user does not need to know |

### Export Errors

| Situation | User-facing message | Recovery action |
|---|---|---|
| Not enough storage | "Your device doesn't have enough space to generate this export. Free up some storage and try again, or try a shorter date range." | Buttons: "Try shorter range" / "OK" |
| PDF generation failed on low-end device | "We couldn't generate the PDF. We've created a CSV file instead — it contains all the same information." | Button: "Download CSV" |
| Export interrupted | "Your export was interrupted. Tap to resume — you won't lose any progress." | Button: "Resume export" |
| No transactions in selected range | "No transactions found for this date range. Try adjusting the dates." | Button: "Change dates" — opens date range picker |
| Export file too large | "This export covers a lot of data. For best results, try splitting it into smaller date ranges (for example, by quarter)." | Buttons: "Try by quarter" / "Export anyway" |

### Authentication Errors

| Situation | User-facing message | Recovery action |
|---|---|---|
| Invalid email/password on sign in | "That email and password combination doesn't match our records. Double-check and try again." | No button — inline on form |
| Email already registered | "There's already an account with this email. Did you mean to sign in instead?" | Button: "Sign in" |
| Weak password | "Your password needs at least 8 characters and one number." | No button — inline on form |
| Session expired | "You've been signed out. Sign in again to continue." | Button: "Sign in" |
| Google OAuth failed | "We couldn't sign you in with Google. Try again or use email instead." | Buttons: "Try again" / "Use email" |

### Data and Sync Errors

| Situation | User-facing message | Recovery action |
|---|---|---|
| Sync failed | No user-facing message in most cases — sync retries in background | After 7 days of failed sync, show in Settings: "Some data hasn't backed up yet. Check your connection." |
| Search index rebuild needed | "Search is rebuilding its index. Results may be slower than usual for a moment." | No action needed — informational only |
| Amount extracted as zero | No user-facing message — flagged for review, user sees review indicator on transaction | User can correct via recategorization flow |
| Duplicate suppressed | No user-facing message — logged in sync_logs | If user reports missing transaction, support flow allows manual override |

---

## 3. Empty States

### Transaction List — No Permissions Granted

```
[Illustration: Phone receiving a bank alert]

Your transactions will appear here automatically
once you connect your bank alerts.

[Connect SMS Alerts]  [Connect Email]
```

**Rules:** Both buttons always visible. Neither is labeled "later" or deprioritized. Illustration must never be a generic sad face or error icon — it shows the value the user is missing.

### Transaction List — Permissions Granted, Import Running

```
[Animated SpendNG loading indicator]

SpendNG is reading your alerts.
Your transactions will appear in a moment.

[subtle progress indicator]
```

If import takes longer than 30 seconds, add below the progress indicator:
> "This may take a minute if you have a large message history. You can keep using the app — we'll let you know when it's done."

### Transaction List — Import Complete, Zero Transactions Found

```
[Illustration: Empty inbox]

No bank alerts found yet.

Transactions appear here automatically when you
receive or make a payment. You can also add
cash transactions manually.

[Add transaction manually]
```

### Search — No Results

```
[Illustration: Magnifying glass finding nothing]

No transactions match your search.

[Active filters displayed as chips]

[Clear all filters]
```

Always show which filters are active. Never show a search empty state without identifying the active constraints.

### Export — No Transactions in Range

```
[Illustration: Empty calendar]

No transactions for this date range.

[Change dates]
```

### Dashboard — New User, No Data Yet

```
[Illustration: Growing plant / chart beginning to rise]

Your financial picture starts here.

SpendNG is building your history in the background.
Check back in a moment.
```

---

## 4. Loading States

### Rule: Loading states must never block interaction unnecessarily.

| Context | Loading pattern |
|---|---|
| Initial SMS import | Progress screen (leaveable) with count and bar |
| Transaction list refresh (pull to refresh) | Subtle spinner at top of list, list remains usable |
| Search results | Incremental — results appear as found, no full-screen block |
| Export generation | Progress bar with percentage and cancel button |
| Dashboard loading on app open | Skeleton placeholders in card shape — never blank white |
| Email connection OAuth | Spinner on the button label only — rest of screen remains visible |
| Account creation | Spinner on the button — form fields disabled during submission |

### Skeleton Loading Pattern
Use skeleton screens (gray animated placeholders in the shape of real content) for:
- Dashboard summary card on cold start
- Transaction list on cold start
- Any list view where data is being fetched

Never use a full-screen spinner for content that has a known shape. Skeleton screens are always preferable.

---

## 5. Offline Behavior

### What works without internet:
- All SMS ingestion and parsing
- All on-device categorization
- Dashboard — reads from local database
- Transaction list and search — reads from local database
- Manual transaction entry — writes locally, queues for sync
- Export to device file (PDF and CSV)

### What does not work without internet:
- Email polling — paused silently
- Cloud backup sync — queued, retries when online
- Export via email share — falls back to "Save to device" only
- Account creation and sign-in — requires connectivity

### How to communicate offline state:
- **Never** show an error banner on the home screen for offline state
- **Never** disable the app or show a blocking overlay for offline state
- **Do** show a small connectivity indicator in Settings → Data Sources: "Email sync paused — no internet connection"
- **Do** show a subtle indicator on the Export screen if the user attempts to email an export while offline: "Email share requires an internet connection. You can save to your device instead." — this is shown inline, not as a modal

### Reconnection behavior:
When connectivity is restored:
- Resume email polling immediately
- Process the sync queue in background
- No user notification required unless sync has been paused for more than 7 days

---

## 6. Notification Error States

| Situation | Behavior |
|---|---|
| Push notification permission denied | Do not re-request. Show an informational note in Settings: "Enable notifications to get transaction alerts." with a link to Settings. |
| SMS ingestion silent for 72+ hours (on Android with SMS permission) | Send a single notification: "SpendNG hasn't seen any bank alerts recently. Tap to check your settings." — sent at most once per 7 days |
| OAuth token expired for email | Send a notification: "Your email connection needs a refresh. Tap to reconnect." — sent once per expiry event, not repeated |

---

## 7. Destructive Action Confirmation

For any action that permanently deletes data, show a confirmation bottom sheet before proceeding.

**Delete account confirmation:**
```
Heading: "Delete your SpendNG account?"
Body: "This will permanently delete all your transactions, categories, and settings. This cannot be undone."
Button 1: "Delete account" — destructive button style (error-main background)
Button 2: "Cancel" — text button
```

**Clear local data confirmation:**
```
Heading: "Clear all local data?"
Body: "Your transactions will be removed from this device. If you have cloud backup enabled, you can restore them by signing back in."
Button 1: "Clear data" — destructive button style
Button 2: "Cancel" — text button
```

**Rule:** Destructive confirmation sheets never have an "are you sure?" chain (confirmation of a confirmation). One confirmation sheet is the maximum. The destructive action button must always be clearly distinguishable from the cancel button by color and position (destructive button on the right or bottom, cancel on the left or above).