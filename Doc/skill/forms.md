# spendng-forms

## Purpose

Defines all form behavior.

Forms must prevent bad data without slowing input.

---

## 1. Input Types

Supported:

- Text
- Number
- Currency
- Email
- Date
- Search
- PIN

---

## 2. Validation Timing

### Real-time

For:

- Email
- Currency
- PIN

### On Blur

For:

- Names
- Notes

---

## 3. Error Message Format

Must follow:

<What is wrong>. <What to do next>.

Example:

"Email address is incomplete. Enter a valid address."

---

## 4. Forbidden Messages

Never show:

- Error codes
- Regex failures
- Stack traces

---

## 5. Required Fields

Must show:

*Required*

Before submission.

Never after.

---

## 6. Currency Input

Auto-format:

₦5,000.00

As user types.

---

## 7. Submit Buttons

Disabled until:

Required fields valid.

---

## 8. Keyboard Behavior

Return key advances.

Last field:

Submit.

---

## 9. Focus Behavior

First invalid field gets focus.

---

## 10. Accessibility

All fields require:

- Label
- Hint
- Error announcement