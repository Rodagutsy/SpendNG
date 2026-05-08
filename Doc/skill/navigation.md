---
name: spendng-navigation-architecture
description: Complete navigation structure for SpendNG including tab layout, stack navigators, modal flows, deep links, and back navigation rules. Use this skill before building any screen, adding any navigation action, or wiring any deep link. Never add a screen or navigation path without checking this skill first. Triggers for all navigation work in SpendNG.
---

# SpendNG Navigation Architecture

This skill defines the complete navigation structure of SpendNG.
Every screen has a defined home. Every navigation action has a defined behavior.
Never add screens or navigation paths that are not defined here without updating this skill first.

---

## 1. Navigator Hierarchy

```
RootNavigator (Stack)
├── OnboardingNavigator (Stack) — shown until onboarding complete
│   ├── WelcomeScreen
│   ├── ValuePropScreen (3 slides, internal state)
│   ├── AccountCreationScreen
│   ├── SMSPermissionScreen (Android only)
│   ├── EmailConnectionScreen
│   └── ImportProgressScreen
│
└── MainNavigator (Bottom Tab) — shown after onboarding complete
    ├── HomeTab
    │   └── HomeScreen
    ├── TransactionsTab
    │   ├── TransactionListScreen
    │   └── TransactionDetailScreen (stack within tab)
    ├── ExportTab
    │   └── ExportScreen
    └── SettingsTab
        ├── SettingsScreen
        ├── DataSourcesScreen (stack within tab)
        ├── AccountScreen (stack within tab)
        └── DeleteAccountScreen (stack within tab)

Modal Overlays (presented over MainNavigator, full screen or bottom sheet):
├── ManualEntryModal (bottom sheet)
├── RecategorizationModal (bottom sheet)
├── FilterPanelModal (bottom sheet)
├── ExportConfigModal (bottom sheet)
├── PermissionExplanationModal (full screen)
└── RulConflictModal (bottom sheet)
```

---

## 2. Onboarding Navigator

### Rules:
- The OnboardingNavigator is the initial route when the app is opened for the first time (no user session exists)
- Once onboarding is complete (user has created an account), the RootNavigator permanently switches to MainNavigator
- The switch is permanent — once MainNavigator is active, OnboardingNavigator is never shown again
- OnboardingNavigator screens have no back button on WelcomeScreen (first screen)
- All other onboarding screens have a back button that navigates within the onboarding flow only

### Screen Transitions:
- Default: horizontal slide (standard iOS/Android stack transition)
- WelcomeScreen → ValuePropScreen: fade transition

### SMSPermissionScreen:
- Shown on Android only
- On iOS, this screen is skipped entirely and the navigator goes directly from AccountCreationScreen to EmailConnectionScreen
- Detect platform with `Platform.OS === 'android'`

### ImportProgressScreen:
- Always shown as the last onboarding screen after at least one permission has been granted
- If the user denied all permissions and skipped email, show the empty state version of the home screen directly — skip ImportProgressScreen
- User can tap "Continue to SpendNG" at any point to leave this screen — import continues in background

---

## 3. Main Navigator (Bottom Tabs)

### Tab Order (left to right):
1. **Home** — house icon
2. **Transactions** — list icon
3. **Export** — download icon
4. **Settings** — gear icon

### Tab Persistence:
- Each tab maintains its own navigation stack
- Navigating away from a tab and returning restores the tab to its last state
- Exception: TransactionDetailScreen — if the user deep-linked into a transaction detail, pressing the Transactions tab icon navigates to TransactionListScreen (not back to the deep-linked detail)

### Active Tab Indicator:
- Follow component spec in `spendng-component-library` — pill indicator behind active icon

---

## 4. Screen Definitions

### HomeScreen
**Route:** `/home`
**Tab:** Home
**Content:** Dashboard summary card, category breakdown bar, recent transactions list (last 10), FAB.
**Navigation from here:**
- Tap transaction → TransactionDetailScreen (push within Transactions tab, also switches active tab to Transactions)
- Tap FAB → ManualEntryModal (bottom sheet)
- Tap category in breakdown → TransactionListScreen with category filter pre-applied (switches to Transactions tab)
- Tap "See all" on recent list → TransactionListScreen (switches to Transactions tab)

### TransactionListScreen
**Route:** `/transactions`
**Tab:** Transactions
**Content:** Search bar, filter chips, full transaction list, FAB.
**Navigation from here:**
- Tap transaction → TransactionDetailScreen (push within same tab)
- Tap FAB → ManualEntryModal (bottom sheet)
- Tap filter icon → FilterPanelModal (bottom sheet)

### TransactionDetailScreen
**Route:** `/transactions/:id`
**Tab:** Transactions (pushed onto Transactions stack)
**Content:** Full transaction detail, category badge, raw alert text (collapsible), edit category button, add note field.
**Navigation from here:**
- Tap "Edit Category" → RecategorizationModal (bottom sheet)
- Back button → TransactionListScreen (or previous screen in stack)

### ExportScreen
**Route:** `/export`
**Tab:** Export
**Content:** Date range picker, filter options, format selector, generate button.
**Navigation from here:**
- No push navigation — all interactions are inline on this screen or in bottom sheets
- Format selection and filter panel open as bottom sheets

### SettingsScreen
**Route:** `/settings`
**Tab:** Settings
**Content:** List of settings categories.
**Navigation from here:**
- Tap "Data Sources" → DataSourcesScreen (push within Settings stack)
- Tap "Account" → AccountScreen (push within Settings stack)
- Tap "Delete Account" → DeleteAccountScreen (push within Settings stack)

---

## 5. Modal Overlays

### ManualEntryModal
**Type:** Bottom sheet
**Trigger:** FAB tap on HomeScreen or TransactionListScreen
**Dismiss:** Drag down, tap scrim, or tap × button
**On save:** Dismiss modal, new transaction appears in list

### RecategorizationModal
**Type:** Bottom sheet
**Trigger:** "Edit Category" button on TransactionDetailScreen
**Content:** Scrollable list of all 14 categories
**On select:** If rule conflict exists, show RuleConflictModal before saving. Otherwise save and dismiss.

### FilterPanelModal
**Type:** Bottom sheet
**Trigger:** Filter icon on TransactionListScreen
**Content:** Category multi-select, date range picker, amount range inputs, transaction type toggle, source channel toggle
**On apply:** Dismiss modal, transaction list updates with new filters applied

### PermissionExplanationModal
**Type:** Full screen (not a bottom sheet — this must feel deliberate and trustworthy)
**Trigger:** Before any OS permission dialog
**Dismiss:** Only via "Allow" or "Set Up Later" buttons — no drag dismiss, no scrim tap dismiss
**Rule:** This modal must never be skippable via a gesture. The user must make a deliberate choice.

### RuleConflictModal
**Type:** Bottom sheet
**Trigger:** When a new user categorization rule conflicts with an existing rule for the same merchant
**Content:** Explanation of the conflict, two options (Replace / Keep old rule)

---

## 6. Deep Links

Deep links are used by push notifications to navigate directly into specific screens.

| Notification Type | Deep Link | Destination |
|---|---|---|
| New transaction captured | `spendng://transactions/:id` | TransactionDetailScreen |
| Weekly summary | `spendng://home` | HomeScreen |
| Data source warning | `spendng://settings/data-sources` | DataSourcesScreen |
| Review reminder | `spendng://transactions?filter=needs_review` | TransactionListScreen with review filter |

### Deep Link Handling Rules:
- If the app is closed, open to the deep link destination after auth check
- If the app is in background, bring to foreground and navigate to destination
- If the user is not authenticated, navigate to onboarding first, then redirect to the deep link destination after auth completes
- If the deep link references a transaction ID that does not exist (deleted or invalid), navigate to TransactionListScreen instead

---

## 7. Back Navigation Rules

### Android Hardware Back Button:
- On HomeScreen, TransactionListScreen, ExportScreen, SettingsScreen (tab roots): minimize the app (do not exit)
- On any pushed stack screen (TransactionDetailScreen, DataSourcesScreen, etc.): pop to previous screen
- On any bottom sheet modal: dismiss the modal
- On OnboardingNavigator first screen (WelcomeScreen): minimize the app

### iOS Swipe Back Gesture:
- Enabled on all stack screens
- Disabled on all bottom sheet modals (drag down dismisses instead)
- Disabled on PermissionExplanationModal (deliberate choice required)

---

## 8. Screen Transition Specifications

| Transition | Animation | Duration |
|---|---|---|
| Stack push (standard) | Slide left | 300ms, ease-in-out |
| Stack pop (back) | Slide right | 250ms, ease-in-out |
| Tab switch | Fade | 150ms |
| Bottom sheet open | Slide up | 300ms, ease-out |
| Bottom sheet dismiss | Slide down | 250ms, ease-in |
| Full screen modal | Slide up (full screen) | 350ms, ease-out |
| Full screen modal dismiss | Slide down | 300ms, ease-in |

**Reduce Motion override:** All slide animations become opacity fades at the same duration when the system Reduce Motion setting is enabled.