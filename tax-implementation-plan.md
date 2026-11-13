# SpendNG Nigerian Tax Engine & Filing Pack — Implementation Plan

**Reference Spec:** [`nigeria-tax-legal-spec.md`](./nigeria-tax-legal-spec.md)  
**Target Statutes:** Nigeria Tax Act, 2025 (NTA, Act No. 7) & Nigeria Tax Administration Act, 2025 (NTAA, Act No. 5), effective 1 January 2026 (plus YA 2025 PITA transition rules).

---

## Goals & Principles

1. **v1 Scope — Personal Income Tax (PIT) First:** Serve **individuals (PAYE), freelancers, content creators, and Business Name / unregistered small businesses** under one unified PIT engine (`computePersonalIncomeTax`), supporting combined/multiple income streams on a single return (`NTAA s. 13`). Limited Liability Companies (`Ltd` — CIT, Development Levy, monthly VAT) are deferred to **Phase 5**.
2. **Legally accurate, year-versioned tax math:** Separate `YA 2026+` (NTA 2025) from `YA 2025` (legacy PITA) by `taxYear`.
3. **Audit-ready classification:** Prevent the #1 desk-review trigger (bank inflows > declared income) by cleanly separating `non-taxable-receipt`, `capital-asset`, `eligible-relief`, and `tax-credit` from operating income/expenses.
4. **Accountant- & officer-ready Filing Pack:** Replace the generic cashflow export in `StepTaxSummary` with a multi-schedule Tax Filing Pack (`NTAA s. 13`).
5. **Clear non-advisory UX:** Every computed figure shows its statutory basis and allows user/accountant overrides.

---

## Phase 1 — Core Tax Calculation Engine (`lib/tax-engine.ts`)

Pure TypeScript module (zero React Native / Supabase dependencies) so it can be unit-tested directly with `node --test`.

### 1.1 Files to Create
- `lib/tax-engine.ts`
- `lib/__tests__/tax-engine.test.ts` (or `.mjs` / `tsc` test script)

### 1.2 Core Types & Config
```ts
export type IncomeStream =
  | 'employment_paye'
  | 'freelance'
  | 'content_creator'
  | 'sole_proprietor'; // unregistered business or CAC Business Name

export type CapitalAssetClass = 'class_1_10pct' | 'class_2_20pct' | 'class_3_25pct';

export interface TaxConfig {
  taxYear: number;
  annualMinimumWage: number;       // 840_000 (₦70k × 12)
  rentReliefRate: number;          // 0.20 (NTA s. 30(2)(a)(vi))
  rentReliefCap: number;           // 500_000
}
```

### 1.3 Functions to Implement
1. **`computePersonalIncomeTax(input)`**:
   - **Tax-year filtering:** Filter transactions to `[Jan 1, Dec 31]` of `taxYear`.
   - **Income aggregation (`NTA s. 28`):** Exclude `non-taxable-receipt` and `final-wht-interest` (`NTAA s. 51(5)`). Track foreign-currency inflows separately for `NTAA s. 39` & `NTA s. 120`.
   - **Allowable business expenses (`NTA ss. 20–21`):** Sum `business-expense` weighted by `businessUsePct / 100`. Flag/warn on any item with `vatChargedOrDutyPaid === false` (`s. 21(p)`). Never deduct `business-asset` or `tax-paid` as expenses.
   - **Digital-asset ring-fencing (`NTA s. 28(3)(iv)`):** Net digital-asset losses can only offset digital-asset gains; excess loss carries forward.
   - **Capital allowances (`NTA First Schedule, Table I`):** Compute straight-line annual allowance per active `CapitalAsset` (`10%`, `20%`, `25%`), pro-rated by `businessUsePct`, retaining `1%` statistical residual (`para 6(a)`), and excluding assets where `vatPaid === false` (`s. 27(2)`).
   - **Eligible deductions (`YA 2026+`, `NTA s. 30(2)(a)`):**
     - `rentRelief = isTenant ? Math.min(annualRentPaid * 0.20, 500_000) : 0`
     - Sum Pension (PRA), NHF, NHIS/HMO, Life Assurance/Annuity, Owner-Occupied Mortgage Interest.
   - **Legacy `YA 2025` branch:** Apply CRA (`max(200_000, 0.01 * gross) + 0.20 * gross`), 7%–24% bands, and 1% minimum tax.
   - **Minimum wage check (`NTA s. 58`, `s. 163(1)(t)`):** Gross employment income ≤ `annualMinimumWage` → `₦0` tax.
   - **Fourth Schedule progressive bands (`NTA s. 58`):** `0%` (first ₦800k), `15%` (next ₦2.2m), `18%` (next ₦9m), `21%` (next ₦13m), `23%` (next ₦25m), `25%` (above ₦50m). Return per-band breakdown for the UI and PDF.
   - **Tax Credits:** Subtract PAYE deducted, verified WHT credits (`whtCredits`), and **Unilateral Foreign Tax Credit (`NTA s. 120`)**:
     `min(foreignTaxPaid, (foreignIncome / totalIncome) * grossNigerianTax)`.

### 1.4 Verification
- Unit tests covering the PIT worked examples from `nigeria-tax-legal-spec.md` / `tax-research.md` (PAYE employee, Freelancer with foreign + local WHT, combined PAYE + Freelance earner, Content Creator, plus YA 2025 PITA, Rent Relief cap at ₦500k, digital-asset loss ring-fence, and `s. 21(p)` VAT disallowance).

---

## Phase 2 — Database Schema, Migrations & Zustand Stores

### 2.1 New Supabase Migration (`supabase/migrations/20261113_tax_engine_schema.sql`)
1. **`tax_profiles` table** (1 row per user, RLS `auth.uid() = user_id`):
   - `user_id` (PK/FK), `income_streams` (`TEXT[]` — multi-select of `employment_paye`, `freelance`, `content_creator`, `sole_proprietor`), `state_of_residence`, `tax_id` (NIN / State Tax ID), `is_tenant`, `annual_rent_override`, `paye_deducted_override`, `updated_at`.
2. **`capital_assets` table** (RLS `auth.uid() = user_id`):
   - `id`, `user_id`, `transaction_id` (nullable FK), `name`, `asset_class` (`class_1_10pct | class_2_20pct | class_3_25pct`), `cost`, `purchase_date`, `vat_paid`, `business_use_pct`, `disposed_at`.
3. **`wht_credits` table** (persists `useTaxStore.whtCredits`, RLS `auth.uid() = user_id`):
   - `id`, `user_id`, `tax_year`, `transaction_id` (nullable FK), `client_name`, `payer_tin`, `gross_amount`, `wht_rate`, `wht_amount`, `net_amount`, `transaction_date`, `credit_note_ref`.
4. **Extend `tax_classifications` & `category_tax_defaults`:**
   - Add income classes: `creator-platform`, `brand-deal`, `digital-asset-gain`, `final-wht-interest`.
   - Add expense/relief classes: `digital-asset-loss`, `rent-paid`, `pension-contribution`, `nhf-contribution`, `nhis-hmo`, `life-assurance`, `mortgage-interest`.
   - Update `category_tax_defaults` (e.g. `rent` → `rent-paid` with `user_can_override = true`).
5. **Extend `transactions` table:**
   - `vat_charged_or_duty_paid BOOLEAN DEFAULT true`
   - `business_use_pct NUMERIC(5,2) DEFAULT 100`
   - `foreign_tax_withheld NUMERIC(15,2) DEFAULT 0`
   - `payer_tin TEXT`

### 2.2 Store & Ingestion Updates
- **`lib/stores/taxProfileStore.ts`** (new): Load/save `tax_profiles`, `capital_assets`, and `wht_credits` from Supabase.
- **`lib/stores/taxStore.ts`**: Persist `whtCredits` via Supabase; wire `taxYear` into all 4 review steps.
- **`lib/stores/transactionStore.ts`**: Map new columns (`vatChargedOrDutyPaid`, `businessUsePct`, `foreignTaxWithheld`, `payerTin`).
- **`lib/ingestion-engine.ts`**: When `isSelfTransfer === true`, automatically set `taxClassificationId = 'non-taxable-receipt'` so own-account transfers never inflate taxable income.

---

## Phase 3 — Tax Prep UI & Profile Screens

1. **Tax Profile Setup (`app/(tabs)/settings/tax-profile.tsx` + link from `tax-prep.tsx` & `settings/profile.tsx`):**
   - Collect multi-select `incomeStreams` (`employment_paye`, `freelance`, `content_creator`, `sole_proprietor`), `stateOfResidence` (36 states + FCT), `taxId` (NIN / State Tax ID), `isTenant` / `annualRentPaid`, and optional `payeDeductedOverride`.
2. **Tax Year Selector (`app/(tabs)/tax-prep.tsx`):**
   - Add a `2025 | 2026` year picker in the header/progress card; filter all step counts and transaction lists by `taxYear`.
   - Add a **Compliance Deadlines Banner** (31 Jan Employer H1 reference, 31 Mar Individual Annual Return `NTAA s. 13`) with statutory penalty reminders (`NTAA ss. 100–102`).
3. **Upgrade `StepIncomeReview.tsx` & `StepExpenseReview.tsx`:**
   - Filter by `taxYear`.
   - In `StepExpenseReview`: persist `CapitalAsset` records (`asset_class`, `vat_paid`, `business_use_pct`) to `capital_assets` instead of local `useState`, and surface a warning badge if `vatChargedOrDutyPaid === false` (`NTA s. 21(p)`).
4. **Upgrade `StepWhtReview.tsx`:**
   - Read existing `t.whtAmount` on credit transactions, allow inline editing of WHT + `payerTIN` + `foreignTaxWithheld`, and persist to `wht_credits`.
5. **Upgrade `StepTaxSummary.tsx`:**
   - Replace the naive `totalIncome - totalDeductibleExpenses` math with `computePersonalIncomeTax`.
   - Display the full waterfall:
     - Gross Taxable Income (excluding `non-taxable-receipt`)
     - Allowable Business Expenses (business-use weighted)
     - Capital Allowances (Table I)
     - Eligible Reliefs (Rent Relief capped at ₦500k, Pension, NHF, HMO, Life Assurance)
     - Chargeable Income
     - Progressive Band-by-Band Tax (Fourth Schedule 0%–25% for YA 2026+, or PITA 7%–24% for YA 2025)
     - Less Credits (PAYE + WHT + Foreign Tax Credit)
     - **Final Tax Payable / Refundable** + non-advisory disclaimer.

---

## Phase 4 — Official Filing Pack Export (`lib/export-service.ts`)

Add `ExportService.generateTaxFilingPackPDF(taxResult, profile, transactions, assets, whtCredits)` generating a single multi-section PDF containing:
1. **Cover & Attestation (`NTAA s. 13(2)(d)`):** Taxpayer name, Tax ID, State IRS, Income Streams, Assessment Year, and taxpayer attestation block.
2. **Tax Computation Sheet:** Exact band-by-band calculation, reliefs, and credits.
3. **Statement of Accounts (P&L Summary):** Revenue by stream, allowable expenses by category, net profit.
4. **Income & Foreign Currency Schedule (`NTAA s. 39`):** Foreign-currency amounts, CBN rates, and Naira equivalents.
5. **Capital Allowance Schedule (`NTA First Schedule, Table I`):** Asset class, cost, rate, annual allowance, 1% statistical residual.
6. **Excluded Non-Taxable Inflows Reconciliation:** Itemised list of `non-taxable-receipt` credits (self-transfers, loans, refunds, gifts) explaining `Total Bank Credits - Excluded = Reportable Income` for tax-officer desk reviews.

---

## Phase 5 — Deferred: Limited Liability Companies (`Ltd`)

Out of scope for v1; planned for a later milestone once PIT is live:
- Separate multi-entity / account-scoping (`personal` vs `company_ltd`) so corporate and personal funds never mix.
- `computeCompanyTax` (`NTA ss. 56, 57, 59, 202`): 0% Small Company vs. 30% CIT + 4% Development Levy, with configurable `smallCompanyTurnoverCap` (`₦50m` Official Gazette default / `₦100m` NASS CTC toggle) and `isProfessionalService` exclusion.
- Monthly 7.5% VAT return tracking (`NTAA s. 22`) and `NTAA s. 11` corporate filing pack.

---

## Verification Checklist

- [ ] `node --test` passes all Phase 1 `tax-engine` unit tests (YA 2026 NTA + YA 2025 PITA + combined PAYE/freelance).
- [ ] `npm run lint` passes with zero TypeScript/ESLint errors.
- [ ] Supabase migration applies cleanly and RLS blocks cross-user reads/writes.
- [ ] End-to-end walkthrough in Expo: configure Tax Profile → classify transactions in `tax-prep.tsx` → add Capital Asset & WHT credit → verify `StepTaxSummary` figures → export Filing Pack PDF.

