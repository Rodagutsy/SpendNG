---
name: spendng-onboarding
description: Complete rules for the SpendNG first-time onboarding experience covering every screen, every decision point, permission handling, import progress, and success criteria. Use this skill before building or modifying any onboarding screen or flow. Triggers for all work on the onboarding navigator, welcome flow, permission flows, and first-run experience.
---

# SpendNG Onboarding

The onboarding flow is the first impression SpendNG makes.
It must earn trust, explain value clearly, and get the user to their first transaction within 60 seconds.
Every word, every screen, and every permission request follows the rules in this document.

---

## 1. Flow Overview

```
WelcomeScreen
    ↓
ValuePropScreen (3 internal slides)
    ↓
AccountCreationScreen
    ↓
SMSPermissionScreen (Android only)
    ↓
EmailConnectionScreen
    ↓
ImportProgressScreen (if any permission granted)
    OR
HomeScreen with empty state (if all permissions denied/skipped)
```

**Time constraint:** The complete flow from open to first transaction visible must take no longer than 3 minutes. Every screen must be completable in under 45 seconds.

---

## 2. WelcomeScreen

**Content:**
- SpendNG logo, centered
- Tagline: *"Your complete money record, built automatically."*
- Single CTA button: **Get Started** (primary button, full width)

**Rules:**
- No back button — this is the entry point
- No skip option — the user must tap Get Started to proceed
- No sign-in link here — sign-in is in the account creation screen, not here
- No marketing copy beyond the tagline — keep it clean and confident

---

## 3. ValuePropScreen (3 Slides)

Three sequential slides with forward/back navigation (dot indicators at bottom). Swipe gesture and arrow buttons both work.

### Slide 1 — Automatic Capture
**Illustration:** Phone receiving an SMS alert with a check mark
**Heading:** "We catch every alert"
**Body:** "SpendNG reads your bank SMS alerts and emails automatically. No typing, no effort."

### Slide 2 — Everything in One Place
**Illustration:** Multiple bank logos flowing into one dashboard
**Heading:** "All your banks, one place"
**Body:** "GTBank, Kuda, Opay, Moniepoint — see everything together for the first time."

### Slide 3 — Tax-Ready Records
**Illustration:** Clean PDF document with a checkmark
**Heading:** "Ready when FIRS calls"
**Body:** "Export clean records anytime — for tax filing, your accountant, or income verification."

**Rules:**
- Each slide: one illustration (160×160pt), one heading (`headline-small-bold`), one body (`body-medium-regular`, max 2 lines)
- Final slide shows a **Continue** button (primary) replacing the dot navigation area
- User can skip all three slides by tapping **Continue** on the last slide — they cannot skip to account creation mid-slides without completing or swiping to the end
- Slides auto-advance after 5 seconds of inactivity only on the first viewing — never on return visits

---

## 4. AccountCreationScreen

**Fields:**
- Email address (required)
- Password (required, min 8 characters, must include at least one number)
- Display name (optional, placeholder: "What should we call you?")

**Alternate flow:**
- **Continue with Google** button (outlined, with Google icon) — triggers Google OAuth, skips email/password fields entirely

**Rules:**
- Password field has show/hide toggle — never show password by default
- Inline validation: email format checked on blur, password strength checked on each keystroke
- Error messages follow the format in `spendng-error-handling`
- Sign-in link at the bottom: "Already have an account? Sign in" — navigates to a sign-in screen (separate from onboarding, presented as a full-screen modal)
- After successful account creation, proceed to SMSPermissionScreen (Android) or EmailConnectionScreen (iOS) — never go back to account creation once an account exists

---

## 5. SMSPermissionScreen (Android Only)

This screen is shown only on Android. Never show it on iOS.

**Layout:**
- Illustration: Phone with SMS icon and SpendNG checking mark (160×160pt)
- Heading: "Let SpendNG read your bank alerts"
- Body (plain language, no jargon):
  > "SpendNG reads SMS messages from your bank and fintech apps to automatically record your transactions. We only read messages from financial institutions — we never read personal messages from your contacts."
- **Allow Access** button (primary)
- **Set Up Later** text button (below primary button)

**Behavior on Allow Access:**
1. Show the PermissionExplanationModal first (this screen IS the explanation — no separate modal needed here since the full explanation is already visible)
2. Trigger the OS SMS permission dialog
3. If granted: show success state (green check, "You're all set") for 1 second, then proceed
4. If denied: do not show an error — proceed to EmailConnectionScreen with a soft note: "No problem, we'll capture your alerts by email instead"

**Behavior on Set Up Later:**
- Proceed to EmailConnectionScreen
- Set a flag to show a single re-prompt notification on day 2 after install
- The day-2 re-prompt is a push notification: "SpendNG works best with SMS access. Tap to set it up — it takes 10 seconds." This notification is shown exactly once, never again after that.

**Rules:**
- Never show the OS permission dialog without first showing this explanation screen
- Never re-prompt more than once (the day-2 reminder counts as the single re-prompt)
- If the user has already denied permission at the OS level, do not trigger the OS dialog again — show a message directing them to Settings instead

---

## 6. EmailConnectionScreen

**Layout:**
- Illustration: Envelope with a connection icon (160×160pt)
- Heading: "Connect your email"
- Body:
  > "Connect Gmail or Outlook to capture transaction alerts from Grey, Geegpay, Flutterwave, and other platforms that send alerts by email."
- **Connect Gmail** button (primary, with Gmail icon)
- **Connect Outlook** button (outlined, with Outlook icon)
- **Skip for now** text button (below both)

**Behavior on Connect Gmail / Connect Outlook:**
1. Trigger OAuth flow for the selected provider
2. On success: show success state (provider icon + green check + "Connected") for 1.5 seconds, then proceed to ImportProgressScreen
3. On failure: show inline error message following `spendng-error-handling` rules. Offer Try Again and Skip for Now.
4. If the OAuth flow fails 3 times in a row: show more detailed help message and link to help documentation

**Behavior on Skip for now:**
- Proceed to ImportProgressScreen if SMS permission was granted, or to HomeScreen with empty state if no permissions have been granted at all

**Rules:**
- Both Gmail and Outlook can be connected — the user is not forced to choose one
- If Gmail is already connected, show it as "Connected" (green check) and still show the Outlook button as a separate option
- The "Skip for now" option must always be visible — never hide or disable it

---

## 7. ImportProgressScreen

Shown when at least one data source has been connected (SMS or email).

**Layout:**
- Animated progress indicator (circular spinner with SpendNG logo in center)
- Heading: "Building your transaction history"
- Progress stats (update live):
  > "Found 247 bank alerts · 183 processed"
- Progress bar (determinate once count is known, indeterminate for first 3 seconds)
- Subtext: "We're starting with the most recent — you'll see transactions appear in a moment"
- **Continue to SpendNG** button (outlined) — available immediately, allows user to leave this screen while import continues in background

**Rules:**
- This screen is always leaveable — the Continue button is always enabled
- Import continues in the background after the user leaves this screen
- If import completes while the user is on this screen, show a success state: green check, "All done — X transactions found", primary Continue button
- If no transactions are found after scanning (all parses failed or inbox is empty), show: "We didn't find any bank alerts yet. They'll appear as you transact." — then navigate to HomeScreen

**Success state (home screen reached):**
The onboarding is considered complete when the user reaches HomeScreen. If at least one transaction is visible at this point, this is the ideal success state. If no transactions are visible yet (import still running), show the importing animation state on the transaction list (see `spendng-error-handling` empty states).

---

## 8. Return Visit Handling

If a user opens the app after completing onboarding:
- Go directly to HomeScreen — never show onboarding screens again
- If the user is not authenticated (session expired or new device), show a sign-in screen — not the full onboarding flow
- If the user completed account creation but did not grant any permissions, show a persistent dismissible banner on HomeScreen: "Connect your bank alerts to start tracking" with two buttons: Connect SMS and Connect Email

---

## 9. Onboarding Quality Checklist

Before shipping the onboarding flow, verify:

- [ ] Full flow completable in under 3 minutes on a mid-range Android device
- [ ] SMSPermissionScreen never shown on iOS
- [ ] OS permission dialog never shown without explanation screen first
- [ ] "Set Up Later" always available on SMS and email screens
- [ ] ImportProgressScreen is always leaveable via Continue button
- [ ] HomeScreen reached with at least one transaction visible within 60 seconds on a device with existing bank SMS history
- [ ] Empty state on HomeScreen is informative and actionable when no permissions are granted
- [ ] Day-2 SMS re-prompt notification fires exactly once and never again
- [ ] Google OAuth failure handled gracefully with retry option
- [ ] Onboarding navigator permanently replaced by MainNavigator after account creation — no way to reach onboarding screens again