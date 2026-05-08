# spendng-notifications

## Purpose

Defines local and push notification behavior.

Notifications must be useful, infrequent, and actionable.

---

## 1. Types

Supported:

- Import complete
- Sync warning
- Permission reminder
- Export complete
- Security alert

---

## 2. Transaction Alerts

SpendNG never re-notifies users about bank alerts.

Only system actions.

---

## 3. Notification Structure

Every notification contains:

- Title
- One-line body
- One action

---

## 4. Tap Behavior

### Import complete

Opens:

Transactions screen

### Sync warning

Opens:

Settings

### Export complete

Opens:

Export detail

---

## 5. Frequency Limits

Permission reminders:

Maximum:

One reminder

Never repeated.

Sync warnings:

Maximum:

Once per 24 hours.

---

## 6. Quiet Hours

No non-critical notifications:

10PM–7AM local time.

---

## 7. Security Alerts

Always bypass quiet hours.

---

## 8. Accessibility

Must support:

- Screen reader
- Dynamic text
- High contrast

---

## 9. Privacy

Notification previews must never display:

- Full account numbers
- Raw SMS content
- OAuth provider details
- Balances on locked devices