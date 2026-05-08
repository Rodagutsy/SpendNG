---
name: spendng-visual-refinement
description: Extends the core design system with dark mode roles, icon mappings, tablet grids, and Z-index scales. Use this skill to ensure pixel-accurate UI across all themes and device sizes. Triggers for all visual implementation tasks.
---

# SpendNG Visual Refinement

This document extends `spendng-design-tokens` with technical implementation details for dark mode, iconography, device responsiveness, and layout layering.

---

## 1. Dark Mode Role Mapping

When `theme = 'dark'`, use these specific token mappings for semantic roles. Roles not listed here remain the same as defined in `spendng-design-tokens`.

| Role | Light Token | Dark Token | Rationale |
| :--- | :--- | :--- | :--- |
| **surface-main** | neutral-96 (`#F5F5F5`) | neutral-10 (`#191919`) | Deep dark background. |
| **surface-on-main**| neutral-100 (`#FFFFFF`) | neutral-20 (`#333333`) | Elevated cards/sheets. |
| **on-background** | neutral-10 (`#191919`) | neutral-96 (`#F5F5F5`) | High contrast text. |
| **outline-main** | nv-50 (`#7B786F`) | nv-30 (`#474540`) | Subtle borders for dark. |
| **outline-variant**| nv-80 (`#C5C3BF`) | nv-20 (`#2B2A27`) | Micro-dividers. |
| **primary** | primary-50 (`#0B5CFF`) | primary-60 (`#3377FF`) | Better visibility on dark. |
| **error-main** | error-40 (`#D30000`) | error-60 (`#FF3333`) | Vibrancy for dark mode. |

---

## 2. Standardized Category Icons

Use these specific **Lucide** (or equivalent) icons for the 14 core categories.

| ID | Category | Icon Name |
| :--- | :--- | :--- |
| cat-01 | Food & Dining | `utensils` |
| cat-02 | Transport | `car` |
| cat-03 | Utilities & Bills | `zap` |
| cat-04 | Airtime & Data | `wifi` |
| cat-05 | Transfers Sent | `arrow-up-right` |
| cat-06 | Transfers Received | `arrow-down-left` |
| cat-07 | Salary & Wages | `wallet` |
| cat-08 | Business Income | `briefcase` |
| cat-09 | Shopping | `shopping-bag` |
| cat-10 | Entertainment | `clapperboard` |
| cat-11 | Health | `stethoscope` |
| cat-12 | Education | `graduation-cap` |
| cat-13 | Rent & Housing | `home` |
| cat-14 | Uncategorized | `help-circle` |

---

## 3. Tablet Breakpoint & Grid

| Property | Value |
| :--- | :--- |
| **Range** | $768\text{px} \dots 1024\text{px}$ |
| **Columns** | 8 |
| **Gutter** | $20\text{px}$ |
| **Margin (Offset)** | $32\text{px}$ |
| **Alignment** | stretch |

**Behavior Rule:** Transaction list items (defined in `spendng-component-library`) should transition from a 1-column stack to a **2-column grid** on tablets to avoid excessively wide text lines.

---

## 4. Z-Index Scale (Elevation Stack)

| Level | Value | Usage |
| :--- | :--- | :--- |
| **base** | 0 | Page content, static elements |
| **raised** | 10 | Elevated cards, list items with shadows |
| **sticky** | 50 | Sticky headers, active search bar |
| **nav** | 100 | Bottom Navigation Bar |
| **overlay** | 200 | Scrim background for modals/sheets |
| **modal** | 300 | Bottom Sheets, Dialogs, Filter Panels |
| **banner** | 400 | In-app notification banners (Top) |
| **toast** | 500 | Snackbars, feedback messages |
| **top** | 999 | Tooltips, debuggers, system overlays |

---

## 5. Micro-Interactions & Transitions

| Interaction | Duration | Easing | Effect |
| :--- | :--- | :--- | :--- |
| **Hover/Focus** | $150\text{ms}$ | `ease-in-out` | Border/Background color shift |
| **Button Click** | $100\text{ms}$ | `ease-out` | Scale to $0.98$ (press) |
| **FAB Click** | $200\text{ms}$ | `ease-out` | Scale to $0.95$ + shadow increase |
| **List Item Press**| $150\text{ms}$ | `linear` | Background ripple (`surface-container-high`) |
| **Sheet Slide** | $300\text{ms}$ | `ease-out` | Slide from bottom to 90% max height |
