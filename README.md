# SpendNG — Financial Tracker

Track spending, categorize transactions, and gain financial insights — all on your phone.

## Problem

Manually tracking expenses is tedious and easy to forget. SpendNG automatically organizes transactions from SMS/email and gives you a clear picture of your finances.

## Tech Stack

- **Framework**: Expo (React Native) — SDK 54
- **Navigation**: Expo Router v3 (file-based)
- **Database**: SQLite via `expo-sqlite` + Drizzle ORM
- **State**: Zustand
- **Auth**: Supabase (with mock client for dev)
- **UI**: Custom components, `expo-linear-gradient`, `@expo/vector-icons`
- **Animations**: `react-native-reanimated` 4 + `react-native-worklets`
- **Fonts**: Poppins (`@expo-google-fonts/poppins`)

## Features

- **Auto-categorization** — Rules match merchant names to categories (Shoprite → Food, Uber → Transport, etc.)
- **Dashboard** — Monthly balance, money in/out, recent activity, quick actions
- **Transaction modal** — Manual entry with receipt upload (image parsing)
- **Export** — Income/expense records for tax filing
- **Onboarding** — Walkthrough screens, account creation, sign in
- **Notifications** — Bell icon with unread count and dropdown
- **Dark mode** — System-aware theming via `use-color-scheme`


### Database

Schema is in `lib/db/schema.ts`. Generate and apply migrations:

```bash
npx drizzle-kit generate
npx drizzle-kit push
```

## Build

```bash
npx eas build --platform android --profile apkPreview
```

## Project Structure

```
app/                  — Expo Router pages (file-based routing)
  _layout.tsx         — Root layout (fonts, DB init, error boundary)
  (onboarding)/       — Welcome, sign-in, account creation
  (tabs)/             — Home, Activity, Insights, Profile
components/           — Reusable UI (Button, TextInput, Modal, etc.)
lib/
  db/                 — Drizzle schema, seed data, migrations
  stores/             — Zustand stores (transactions, categories, UI)
  supabase.ts         — Supabase client (or mock)
assets/images/        — Icons and splash images
```

## What I Learned

- Integrating Drizzle ORM with `expo-sqlite` on React Native
- File-based routing with Expo Router v3
- New Architecture (Fabric) with Reanimated 4 and Worklets
- Supabase auth in a mobile context
- Zustand for lightweight client-state management

---

*Built with Expo and React Native.*
