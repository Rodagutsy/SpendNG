# spendng-accessibility

## Purpose

This skill defines all accessibility requirements for SpendNG.

No screen, component, animation, interaction, or visual state may be built without complying with this specification.

Accessibility is treated as a build-time requirement, not a post-build enhancement.

---

## 1. Touch Targets

### Minimum Interactive Area

Every interactive element must have a minimum touch target of:

44 x 44 pt

This includes:

- Buttons
- Tabs
- List items
- Chips
- Filter controls
- Icons with tap actions
- Close buttons
- Floating action buttons
- Bottom sheet handles

### Rules

- Visual size may be smaller than 44 x 44, but touch area may never be.
- Invisible padding may be added.
- Adjacent touch targets must maintain at least 8pt separation.

### Build Failure Conditions

The build fails if:

- Any interactive target is less than 44 x 44.
- Hit areas overlap.

---

## 2. Typography Accessibility

### Minimum Sizes

| Type | Minimum |
|------|---------|
| Body | 14sp |
| Primary Labels | 16sp |
| Captions | 12sp |
| Tooltips | 12sp |

### Rules

- Text may scale above these values.
- Text may never scale below these values.
- Decorative typography is exempt only for illustration assets.

---

## 3. Dynamic Type

### System Font Scaling

SpendNG must always respect:

- Android font scaling
- iOS Dynamic Type

### Rules

Never:

- Override system scaling
- Clamp text scaling
- Render fixed-height text containers

Containers must expand vertically.

### Build Failure Conditions

The build fails if:

- Any text clips under 200% scaling.
- Any label truncates critical information.

---

## 4. Contrast

All text/background combinations must meet WCAG AA:

### Normal Text

4.5:1 minimum

### Large Text

3:1 minimum

### UI Components

3:1 minimum

### Rules

All design token pairings must be validated.

No custom color overrides.

---

## 5. Color Usage

Color must never be the sole communication channel.

Every color state must also include:

- Text
or
- Icon
or
- Shape change

### Examples

Correct:

Income:
🟢 + “Income”

Incorrect:

Green text only

---

## 6. Screen Reader Labels

Every interactive element requires:

- accessibilityLabel
- accessibilityHint

### Examples

Export button:

Label:
"Export transactions"

Hint:
"Opens export options"

---

## 7. Transaction Announcement Format

Transaction list items must announce in this exact order:

<Transaction Type>, <Amount>, <Merchant>, <Category>, <Date>

Example:

"Debit, 5,000 naira, Uber, Transport, April 12"

---

## 8. Focus Management

When overlays open:

- focus moves into overlay

When overlays close:

- focus returns to triggering element

Applies to:

- Bottom sheets
- Dialogs
- Permission screens

---

## 9. Motion Accessibility

Every animation must check:

Reduce Motion system setting

### If enabled:

Replace:

- Slide
- Scale
- Spring

With:

Opacity fade only

Maximum duration:

150ms

---

## 10. Haptics

Haptics must always be optional.

If system haptics are disabled:

SpendNG must not force vibration.

---

## 11. Testing Requirements

Accessibility tests must verify:

- Screen reader navigation
- Font scaling
- Contrast
- Touch targets
- Focus order
- Reduce motion

A screen cannot ship without passing all checks.