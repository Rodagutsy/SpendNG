# spendng-loading-state

## Purpose

Defines loading behavior.

Loading states must reassure without misleading.

---

## 1. Maximum Spinner Duration

2 seconds

After 2 seconds:

Switch to skeleton.

---

## 2. Skeleton Loading

Used for:

- Dashboard
- Transaction list
- Export preview

### Rules

Skeleton must match final layout.

No generic bars.

---

## 3. Progress Indicators

Used for:

- Import
- Export
- Sync

Must show:

- Percentage
- Record count

Example:

"Importing 42 of 210"

---

## 4. Blocking Loaders

Allowed only for:

- Authentication
- Encryption initialization

Maximum:

5 seconds

---

## 5. Background Loading

Must not block:

- Search
- Navigation
- Filtering

---

## 6. Offline Queue Loading

Show:

"Waiting to sync"

No spinner.

---

## 7. Accessibility

Screen reader announces:

"Loading"

Then:

"Complete"

---

## 8. Animation

Respect Reduce Motion.