---
name: spendng-design-tokens
description: The complete SpendNG design token system. Use this skill for every UI decision in the SpendNG app — colors, typography, spacing, shadows, and grids. Never pick a color, font, size, or shadow from memory or guesswork. Always consult this skill first. Triggers whenever building, modifying, or reviewing any SpendNG screen, component, or visual element.
---

# SpendNG Design Tokens

This skill is the single source of truth for every visual decision in SpendNG.
Never use a color, font size, weight, shadow, or spacing value that is not defined here.
If a value is not in this document, consult `spendng-visual-refinement` for dark mode roles, iconography, and device-specific grids. If still not found, flag it and ask before proceeding.

---

## 1. Color System

### 1.1 Key Colors (Brand Primitives)

| Token | Hex Value | Usage |
|---|---|---|
| Primary Key | `#0b5cff` | Primary actions, links, active states |
| Secondary Key | `#0bd6ff` | Secondary actions, highlights |
| Accent | `#ffc107` | Warnings, highlights, special callouts |
| Neutral | `#070707` | Primary text |
| Neutral Variant | `#474540` | Secondary text, subheadings |
| Success | `#00ff00` | Use success palette roles, not this raw value |
| Warning | `#ffff00` | Use warning palette roles, not this raw value |
| Error | `#ff0000` | Use error palette roles, not this raw value |

**Rule:** Never use raw key colors directly in UI. Always use the role mappings in Section 1.3.

---

### 1.2 Color Palettes

Each palette runs from 0 (darkest) to 100 (white). Use the role system in 1.3 to select the right shade. Reference these palettes only when building the role system or when a specific shade is explicitly required.

**Primary Palette**
- primary-0: `#000000` | primary-10: `#001133` | primary-20: `#002266`
- primary-30: `#003399` | primary-40: `#0044cc` | primary-50: `#0b5cff`
- primary-60: `#3377ff` | primary-70: `#6699ff` | primary-80: `#99bbff`
- primary-90: `#ccddff` | primary-93: `#dbe7ff` | primary-96: `#ebf1ff`
- primary-99: `#fafbff` | primary-100: `#ffffff`

**Secondary Palette**
- secondary-0: `#000000` | secondary-10: `#002a33` | secondary-20: `#005566`
- secondary-30: `#007f99` | secondary-40: `#00aacc` | secondary-50: `#00d4ff`
- secondary-60: `#33ddff` | secondary-70: `#66e5ff` | secondary-80: `#99eeff`
- secondary-90: `#ccf6ff` | secondary-93: `#dbf9ff` | secondary-96: `#ebfcff`
- secondary-99: `#fafeff` | secondary-100: `#ffffff`

**Accent Palette**
- accent-0: `#000000` | accent-10: `#332600` | accent-20: `#664c00`
- accent-30: `#997300` | accent-40: `#cc9900` | accent-50: `#ffbf00`
- accent-60: `#ffcc33` | accent-70: `#ffd966` | accent-80: `#ffe599`
- accent-90: `#fff2cc` | accent-93: `#fff5d6` | accent-96: `#fffaeb`
- accent-99: `#fffdfа` | accent-100: `#ffffff`

**Neutral Palette**
- neutral-0: `#000000` | neutral-10: `#191919` | neutral-20: `#333333`
- neutral-30: `#4c4c4c` | neutral-40: `#666666` | neutral-50: `#808080`
- neutral-60: `#999999` | neutral-70: `#b3b3b3` | neutral-80: `#cccccc`
- neutral-90: `#e6e6e6` | neutral-93: `#ededed` | neutral-96: `#f5f5f5`
- neutral-99: `#fcfcfc` | neutral-100: `#ffffff`

**Neutral Variant Palette**
- nv-0: `#000000` | nv-10: `#10100f` | nv-20: `#2b2a27`
- nv-30: `#474540` | nv-40: `#615e57` | nv-50: `#7b786f`
- nv-60: `#959189` | nv-70: `#adaaa4` | nv-80: `#c5c3bf`
- nv-90: `#dddcd9` | nv-93: `#e2e1df` | nv-96: `#eeeeec`
- nv-99: `#f5f5f4` | nv-100: `#ffffff`

**Success Palette**
- success-20: `#006600` | success-40: `#00bd00` | success-90: `#ccffcc`
- success-96: `#ebffeb`

**Warning Palette**
- warning-20: `#666600` | warning-40: `#cccc00` | warning-90: `#ffffcc`
- warning-96: `#ffffeb`

**Error Palette**
- error-20: `#660000` | error-40: `#d30000` | error-90: `#ffcccc`
- error-96: `#ffebeb`

---

### 1.3 Color Role Mappings (Use These in All UI)

**Primary Roles**
| Role | Value | Usage |
|---|---|---|
| primary | primary-50 `#0b5cff` | Primary buttons, active tab, key interactions | Secondary buttons should use  
| on-primary | primary-100 `#ffffff` | Text/icons on primary background |
| primary-container | primary-93 `#dbe7ff` | Tinted backgrounds, chips, badges |
| on-primary-container | primary-30 `#003399` | Text on primary container |

**Secondary Roles**
| Role | Value | Usage |
|---|---|---|
| secondary | secondary-40 `#00aacc` | secondary actions |
| on-secondary | secondary-100 `#ffffff` | Text/icons on secondary background |
| secondary-container | secondary-90 `#ccf6ff` | Secondary tinted backgrounds | pills background
| on-secondary-container | secondary-30 `#007f99` | Text on secondary container | text on pill

**Accent Roles**
| Role | Value | Usage |
|---|---|---|
| accent | accent-40 `#cc9900` | Highlights, warning states, special callouts |
| on-accent | accent-100 `#ffffff` | Text on accent background |
| accent-container | accent-90 `#fff2cc` | Accent tinted backgrounds |
| on-accent-container | accent-30 `#997300` | Text on accent container |

**System Roles**
| Role | Value | Usage |
|---|---|---|
| error-main | error-40 `#d30000` | Error states, destructive actions |
| error-container | error-90 `#ffcccc` | Error background chips, banners |
| on-error-container | error-30 `#990000` | Text on error container |
| warning-main | warning-40 `#cccc00` | Warning states |
| warning-container | warning-90 `#ffffcc` | Warning background |
| success-main | success-40 `#00bd00` | Success states, confirmed transactions |
| success-container | success-90 `#ccffcc` | Success background |

**Surface Roles**
| Role | Value | Usage |
|---|---|---|
| surface-main | neutral-96 `#f5f5f5` | App background |
| surface-on-main | nv-100 `#ffffff` | Cards, sheets on surface |
| surface-variant | neutral-90 `#e6e6e6` | Dividers, subtle backgrounds |
| surface-container-highest | neutral-90 `#e6e6e6` | Highest elevation surfaces |
| surface-container-high | neutral-93 `#ededed` | High elevation |
| surface-container | neutral-96 `#f5f5f5` | Default container |
| surface-container-low | neutral-99 `#fcfcfc` | Low elevation |
| surface-container-lowest | neutral-100 `#ffffff` | Bottom/base surfaces |
| surface-inverse | nv-20 `#2b2a27` | Dark surfaces, inverse headers |
| surface-inverse-on | nv-96 `#eeeeec` | Text on inverse surface |

**Outline Roles**
| Role | Value | Usage |
|---|---|---|
| outline-main | nv-50 `#7b786f` | Input borders, dividers |
| outline-variant | nv-80 `#c5c3bf` | Subtle dividers, secondary borders |

**Utility Roles**
| Role | Value | Usage |
|---|---|---|
| background | primary-99 `#fafbff` | Page background |
| on-background | primary-10 `#001133` | Primary text on background |
| scrim | neutral-10 `#191919` | Modal overlays, scrims |
| shadow | neutral-0 `#000000` | Drop shadow color |

---

## 2. Typography System

### 2.1 Font Families

| Family | Usage |
|---|---|
| Red Hat Display | Display (72–40px) and Headline (32–24px) |
| Red Hat Text | Title (22–18px) |
| Poppins | Body (18–15px), Label (14–11px), Button |

**Rule:** Never substitute these fonts. If a font is unavailable, flag it immediately. Do not fall back to system fonts silently.

---

### 2.2 Display Scale (Red Hat Display)

| Token | Size | Weight | Line Height | Letter Spacing |
|---|---|---|---|---|
| display-large-bold | 72px | 700 | 86px | -1.44px |
| display-large-semibold | 72px | 600 | 86px | -1.44px |
| display-medium-bold | 56px | 700 | 70px | -1.12px |
| display-medium-semibold | 56px | 600 | 70px | -1.12px |
| display-small-bold | 40px | 700 | 52px | -0.72px |
| display-small-semibold | 40px | 600 | 52px | -0.72px |

### 2.3 Headline Scale (Red Hat Display)

| Token | Size | Weight | Line Height | Letter Spacing |
|---|---|---|---|---|
| headline-large-bold | 32px | 700 | 42px | -0.512px |
| headline-large-semibold | 32px | 600 | 42px | -0.512px |
| headline-medium-bold | 28px | 700 | 35px | -0.42px |
| headline-medium-semibold | 28px | 600 | 35px | -0.42px |
| headline-small-bold | 24px | 700 | 32px | -0.336px |
| headline-small-semibold | 24px | 600 | 32px | -0.336px |

### 2.4 Title Scale (Red Hat Text)

| Token | Size | Weight | Line Height | Letter Spacing |
|---|---|---|---|---|
| title-large-semibold | 22px | 600 | 30px | -0.22px |
| title-large-medium | 22px | 500 | 30px | -0.22px |
| title-medium-semibold | 20px | 600 | 28px | -0.20px |
| title-medium-medium | 20px | 500 | 28px | -0.20px |
| title-small-semibold | 18px | 600 | 24px | -0.18px |
| title-small-medium | 18px | 600 | 24px | -0.18px |

### 2.5 Body Scale (Poppins)

| Token | Size | Weight | Line Height | Letter Spacing |
|---|---|---|---|---|
| body-large-medium | 18px | 500 | 24px | -0.18px |
| body-large-regular | 18px | 400 | 24px | -0.18px |
| body-medium-medium | 16px | 500 | 22px | -0.096px |
| body-medium-regular | 16px | 400 | 22px | -0.096px |
| body-small-medium | 15px | 500 | 22px | -0.12px |
| body-small-regular | 15px | 400 | 22px | -0.12px |

### 2.6 Label Scale (Poppins)

| Token | Size | Weight | Line Height | Letter Spacing |
|---|---|---|---|---|
| label-large-medium | 14px | 500 | 20px | -0.07px |
| label-large-regular | 14px | 400 | 20px | -0.07px |
| label-medium-medium | 12px | 500 | 18px | -0.036px |
| label-medium-regular | 12px | 400 | 16px | -0.036px |
| label-small-medium | 11px | 500 | 14px | +0.011px |
| label-small-regular | 11px | 400 | 14px | +0.011px |

### 2.7 Button Scale (Poppins)

| Token | Size | Weight | Line Height | Letter Spacing |
|---|---|---|---|---|
| button-large | 16px | 500 | 16px | -0.16px |
| button-medium | 14px | 500 | 14px | -0.084px |
| button-small | 12px | 500 | 12px | 0px |

---

## 3. Shadow System

| Token | Blur | Offset Y | Spread | Color |
|---|---|---|---|---|
| shadow-xs | 2px | 1px | 0px | `#1c1c1c` at 5% opacity |
| shadow-sm | 3px | 1px | 0px | `#1c1c1c` at 10% opacity |
| shadow-normal | 8px | 4px | -2px | `#1c1c1c` at 10% opacity |
| shadow-large | 24px | 20px | -4px | `#1c1c1c` at 10% opacity |
| shadow-xlarge | 48px | 24px | -12px | `#1c1c1c` at 25% opacity |

**Usage Rules:**
- Cards and list items: shadow-xs or shadow-sm
- Bottom sheets and modals: shadow-large
- Floating action button: shadow-normal
- Elevated dialogs: shadow-xlarge
- Never apply shadow to flat/surface-level elements

---

## 4. Grid System

### 4.1 Mobile Grid
- Pattern: Columns
- Column count: 4
- Gutter size: 16px
- Offset (margin): 24px
- Alignment: stretch

Row baseline:
- Section size: 8px
- Gutter: 8px
- Offset: 8px

### 4.2 Desktop Grid
- Pattern: Columns
- Column count: 10
- Gutter size: 24px
- Offset (margin): 40px
- Alignment: stretch

Row baseline:
- Section size: 24px
- Gutter: 16px

---

## 5. Spacing Scale

Use multiples of 4px for all spacing decisions.

| Token | Value | Usage |
|---|---|---|
| space-1 | 4px | Micro spacing, icon padding |
| space-2 | 8px | Tight internal padding |
| space-3 | 12px | Component internal padding |
| space-4 | 16px | Standard padding, gutter |
| space-5 | 20px | Section spacing |
| space-6 | 24px | Card padding, offset |
| space-8 | 32px | Large section gaps |
| space-10 | 40px | Desktop offset, hero spacing |
| space-12 | 48px | Major section separation |

---

## 6. Border Radius Scale

| Token | Value | Usage |
|---|---|---|
| radius-xs | 4px | Small chips, tags |
| radius-sm | 8px | Input fields, small cards |
| radius-md | 12px | Cards, list items |
| radius-lg | 16px | Bottom sheets, modals |
| radius-xl | 24px | Large cards, hero elements |
| radius-full | 9999px | Pills, avatars, FAB |

---

## 7. Hard Rules

These rules are non-negotiable and apply to every screen and component in SpendNG:

1. Never use a hex color that is not in this document. If a design requires a color not listed, raise it before proceeding.
2. Never use a font other than Red Hat Display, Red Hat Text, or Poppins.
3. Color alone must never be the only indicator of meaning. Always pair color with a text label or icon.
4. Transaction debits are displayed in error-main. Transaction credits are displayed in success-main. This rule never changes.
5. Never override the user's system font size setting.
6. All body text minimum 14px. All primary labels minimum 16px. Captions and tooltips minimum 12px.
7. All text must meet WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large text) against its background.
8. The primary color (`#0b5cff`) is never used on a white background for body text — contrast ratio is insufficient. Use on-background (`#001133`) for body text on light surfaces.