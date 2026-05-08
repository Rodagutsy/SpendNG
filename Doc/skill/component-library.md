---
name: spendng-component-library
description: Defines every reusable UI component in SpendNG with exact specifications for layout, tokens, states, and behavior. Use this skill before building any screen or UI element in SpendNG. Never design a component from scratch — check this skill first. If a component you need is not defined here, define it here before building it. Triggers for all UI construction in SpendNG.
---

# SpendNG Component Library

All components use tokens from `spendng-design-tokens`. Never use raw values.
All components meet the accessibility rules in `spendng-accessibility`.
All touch targets are minimum 40×40pt regardless of visual size.
For layering (z-index) and responsive grid behavior (tablet/desktop), refer to `spendng-visual-refinement`.

---

## 1. Transaction List Item

The most frequently rendered component in the app.

**Layout:** Horizontal row, full width, 72px height minimum.

```
[Category Icon]  [Merchant Name        ]  [Amount    ]
[16px]           [Account • Date        ]  [Category  ]
```

**Left:** Category icon in a 40×40pt circle. Circle background: `category.color_hex` at 15% opacity. Icon: `category.color_hex` at 100%.

**Center:**
- Line 1: Merchant name — `body-medium-medium`, color `on-background`
- Line 2: Account name + bullet + formatted date — `label-large-regular`, color `neutral-60`

**Right:**
- Line 1: Amount — `body-medium-medium`
  - Debit: `error-main` with minus prefix (e.g. `-₦4,500`)
  - Credit: `success-main` with plus prefix (e.g. `+₦50,000`)
- Line 2: Category name — `label-medium-regular`, color `neutral-60`

**Manual entry indicator:** Small `label-small-medium` tag reading "Manual" in `primary-container` background with `on-primary-container` text, positioned below the merchant name.

**Review flag indicator:** Small orange dot (8px, `accent`) positioned top-right of the category icon circle.

**Padding:** 16px horizontal, 12px vertical.
**Divider:** 1px `outline-variant` between items, 16px left inset.
**Touch feedback:** `surface-container-high` ripple on press.
**Touch target:** Full row width × full row height (minimum 72px).

---

## 2. Category Badge

Used inside transaction detail, filter chips, and category breakdown.

**Anatomy:** Icon + label in a pill shape.

**Sizes:**
- Large: 24px height, 12px horizontal padding, `label-large-medium` font
- Medium: 20px height, 8px horizontal padding, `label-medium-medium` font
- Small: 16px height, 6px horizontal padding, `label-small-medium` font

**Colors:** Background is `category.color_hex` at 15% opacity. Text and icon are `category.color_hex` at 100%.

**Rule:** Category badge always shows both icon AND text. Never show icon alone or text alone. This is an accessibility requirement.

---

## 3. Amount Display

Used for large figures on the dashboard and in transaction detail.

**Dashboard totals:**
- Size: `display-small-bold` or `headline-large-bold` depending on available space
- Income total: `success-main`
- Spending total: `error-main`
- Currency symbol: same size and color as amount, no space between symbol and number

**Transaction detail amount:**
- Size: `headline-medium-bold`
- Color rules: same as transaction list item

**Formatting rules:**
- Always show two decimal places: ₦4,500.00 not ₦4,500
- Use comma thousands separator: ₦1,250,000.00
- For USD/GBP/EUR: use appropriate symbol ($, £, €) with same formatting
- Never truncate or abbreviate amounts (show ₦1,250,000.00 not ₦1.25M)

---

## 4. Floating Action Button (FAB)

For manual transaction entry. Fixed position, always visible on Home and Transaction List screens.

**Size:** 48×48pt.
**Shape:** Circle (`radius-full`).
**Background:** `primary`.
**Icon:** Plus symbol, `on-primary`, 20×20pt.
**Shadow:** `shadow-md`.
**Position:** 24px from bottom edge, 24px from right edge. Positioned above the bottom navigation bar — never overlaps with nav bar.
**Touch target:** 48×48pt.
**Press state:** Scale to 0.95 with `shadow-normal` on press. Return to 1.0 with `shadow-small` on release.

---

## 5. Bottom Sheet

Used for manual entry form, filter panel, recategorization, and action menus.

**Drag handle:** 32px wide × 4px tall, `outline-variant`, centered, 12px from top of sheet.
**Background:** `surface-container-lowest` (white).
**Corner radius:** `radius-lg` (16px) on top corners only.
**Shadow:** `shadow-md`.
**Max height:** 90% of screen height.
**Dismiss:** Drag down past 30% of sheet height, or tap scrim behind sheet.
**Scrim:** `scrim` color at 40% opacity behind sheet. Tap to dismiss.
**Animation:** Sheet slides up from bottom. Duration 300ms. Easing: `ease-out`.

---

## 6. Dashboard Summary Card

**Layout:** Two-column row showing Income and Spending side by side.

```
[This Month                              ]
[Income          |    Spending           ]
[+₦280,000       |   -₦142,500          ]
[vs last month ↑12%  vs last month ↑8%  ]
```

**Card style:** `surface-container-lowest` background, `radius-lg`, `shadow-sm`, 16px padding.
**Month label:** `label-large-regular`, `neutral-60`.
**Column labels:** `label-large-medium`, `neutral-40`.
**Amount:** `headline-medium-bold`. Income: `success-main`. Spending: `error-main`.
**Month-over-month:** `label-medium-regular`. Positive delta: `success-main` with up arrow. Negative delta: `error-main` with down arrow. Neutral: `neutral-60`.

---

## 7. Category Breakdown Bar

Horizontal stacked bar showing spending proportion by category for the current period.

**Bar height:** 8px, `radius-full`.
**Each segment:** `category.color_hex` at 80% opacity, proportional to category total.
**Legend below bar:** Row of category badges (small size) with percentage labels.
**Tap on segment or badge:** Navigate to filtered transaction list for that category.

---

## 8. Empty State Component

**Layout:** Centered vertically and horizontally in the available space.

```
[Illustration — 160×160pt]
[Primary message          ]
[Secondary message        ]
[Action Button(s)         ]
```

**Illustration:** Placeholder slot for a simple line illustration. Never leave this as a blank square — always provide at least a simple SVG icon from magnific.com.
**Primary message:** `title-medium-semibold`, `on-background`, centered.
**Secondary message:** `body-medium-regular`, `neutral-60`, centered, max 2 lines.
**Action buttons:** Primary button and optional secondary button. See Button component spec.

**Rule:** Every empty state must have at least one action button. Never show an empty state with no path forward.

---

## 9. Progress Bar

Used for import progress, export progress, and any background operation.

**Determinate (known progress):**
- Height: 4px
- Background track: `surface-variant`
- Fill: `primary`
- Corner radius: `radius-full`
- Animate fill width smoothly — never jump

**Indeterminate (unknown progress):**
- Same dimensions
- Animated shimmer from left to right
- Color: `primary`

---

## 10. Filter Chip

Used in the search and transaction filter interface.

**Default state:** `surface-variant` background, `on-background` text, `outline-variant` border 1px.
**Active state:** `primary-container` background, `on-primary-container` text, no border.
**Size:** 32px height, 12px horizontal padding, `label-large-medium` font.
**Corner radius:** `radius-full`.
**With icon:** Icon is 16×16pt, 4px gap between icon and label.
**Clear button:** When active, shows an × icon on the right of the chip. Single tap clears this filter.

---

## 11. Form Inputs

Used in manual entry, account creation, and settings.

**Default state:**
- Height: 48px
- Border: 1px `outline-variant`
- Corner radius: `radius-sm`
- Background: `surface-container-lowest`
- Label (floating): `label-small-regular`, `neutral-60`
- Input text: `body-medium-regular`, `on-background`

**Focused state:**
- Border: 2px `primary`
- Label floats to top: `label-medium-regular`, `primary`

**Error state:**
- Border: 1px `error-main`
- Label: `label-medium-regular`, `error-main`
- Error message below input: `label-medium-regular`, `error-main`, '4px below input field'

**Disabled state:**
- Background: `surface-variant`
- Text: `neutral-60`
- No interaction

**Rule:** Validation is always inline, shown immediately below the relevant field. Never show a modal or toast for form validation errors. Never prevent the user from seeing the error message because it is hidden below the fold.

---

## 12. Buttons

**Primary Button:**
- Background: `primary`
- Text: `on-primary`, `button-large`
- Height: 48px, corner radius: `radius-full`
- Full width in forms, auto-width in inline contexts
- Disabled: `neutral-80` background, `neutral-60` text

**Secondary Button (Outlined):**
- Background: transparent
- Border: 1.5px `primary`
- Text: `primary`, `button-large`
- Same dimensions as primary

**Text Button:**
- No background, no border
- Text: `primary`, `button-medium`
- Used for low-emphasis actions

**Destructive Button:**
- Background: `error-main`
- Text: `on-primary` (white), `button-large`
- Used only for irreversible destructive actions (account deletion, data clearing)

**Loading state (any button):** Replace label with a 20px circular spinner in the same color as the label. Disable interaction while loading. Never show both label and spinner simultaneously.

---

## 13. Bottom Navigation Bar

**Structure:** 4 tabs — Home, Transactions, Export, Settings.
**Height:** 64px + safe area inset.
**Background:** `surface-container-lowest` with `shadow-xs` on top edge.
**Active tab:** Icon in `primary`, label in `primary`, `label-small-medium`.
**Inactive tab:** Icon and label in `neutral-60`, `label-small-medium`.
**Icon size:** 24×24pt.
**Active indicator:** 64px wide × 32px tall pill behind active icon, `primary-container` background.
**Touch target:** Each tab is minimum 44pt wide × 64pt tall.

---

## 14. Notification Banner (In-App)

Used for data source warnings and sync status. Not for errors (use inline error messages for those).

**Layout:** Full width, below status bar, above screen content.
**Background:**
- Warning: `warning-container`
- Info: `primary-container`
**Text:** `label-large-medium`, `on-warning-container` or `on-primary-container`.
**Dismiss:** × button on right. Dismissible always.
**Rule:** Never stack multiple banners. Show only the highest-priority one at a time. The banner must not push screen content down — it overlays the top of the screen.