---
name: spendng-categorization-engine
description: Complete rules for SpendNG's transaction categorization system including category definitions, rule priority, merchant matching, self-transfer detection, salary detection, and user correction behavior. Use this skill before building or modifying anything that assigns, displays, or updates transaction categories. Triggers for all category-related logic in SpendNG.
---

# SpendNG Categorization Engine

This skill defines exactly how every transaction gets its category.
Consistent, accurate categorization is what makes SpendNG useful.
Never make ad-hoc categorization decisions — always follow the rules in this document.

---

## 1. The Fourteen Categories

These are the only categories in version 1. No new categories may be added without updating this skill. Standardized icons for these categories are defined in `spendng-visual-refinement`.

| ID | Name | Type Hint | Primary Signals |
|---|---|---|---|
| cat-01 | Food & Dining | debit | Restaurant names, supermarket names, food delivery platforms |
| cat-02 | Transport | debit | Ride-hailing apps, fuel stations, transport companies, toll payments |
| cat-03 | Utilities & Bills | debit | DSTV, PHCN/EKEDC/IKEDC/electricity DISCOs, water boards, internet providers |
| cat-04 | Airtime & Data | debit | Airtel, MTN, Glo, 9mobile, Spectranet, Smile, airtime/data keyword |
| cat-05 | Transfers Sent | debit | Generic bank transfers with no merchant name, "transfer to", person names |
| cat-06 | Transfers Received | credit | Generic inbound transfers with no merchant context |
| cat-07 | Salary & Wages | credit | Employer names, "salary", "payroll", "wages", regular monthly credits |
| cat-08 | Business Income | credit | Client payments, invoice payments, POS income, business account credits |
| cat-09 | Shopping | debit | Retail stores, e-commerce platforms (Jumia, Konga), fashion retailers |
| cat-10 | Entertainment | debit | Streaming services (Netflix, Showmax), cinemas, gaming platforms |
| cat-11 | Health | debit | Pharmacies, hospitals, clinics, health insurance |
| cat-12 | Education | debit | Schools, universities, online learning platforms, exam fees |
| cat-13 | Rent & Housing | debit | Large annual or quarterly debits, "rent", "landlord", property agencies |
| cat-14 | Uncategorized | both | Default when no rule matches with sufficient confidence |

---

## 2. Rule Priority Order

Apply rules in this exact order. Stop at the first successful match.

**Priority 1 — Exact Merchant Name Match**
Compare the parsed `merchant_name` exactly (case-insensitive) against the keyword field in the rules table where `match_type = 'exact'`. If found, use that rule's category.

**Priority 2 — Partial Keyword Match (contains)**
Check if `merchant_name` contains any keyword from rules where `match_type = 'contains'`. If multiple keywords match, use the rule with the highest `priority` value.

**Priority 3 — Starts With Match**
Check if `merchant_name` starts with any keyword from rules where `match_type = 'starts_with'`.

**Priority 4 — Transaction Pattern Match**
Apply pattern rules that use `transaction_type`, amount range, or sender as signals rather than merchant name. Examples: all credits from salary-identified senders → cat-07, all debits with no merchant name → cat-05.

**Priority 5 — Uncategorized**
If no rule matches with confidence, assign cat-14 (Uncategorized) and set `is_flagged_for_review: true`.

---

## 3. System Rules Seed Data

These rules are bundled with the app and applied at Priority 2 and 3. They are `is_system: true` and cannot be deleted by users (only supplemented by user rules).

**Food & Dining (cat-01)**
Keywords (contains): shoprite, spar, tasty, chicken republic, dominos, kfc, mr biggs, kilimanjaro, uber eats, glovo, jumia food, coldstone, sweet sensation, tantalizers, food

**Transport (cat-02)**
Keywords (contains): uber, bolt, taxify, indriver, rida, total, mobil, oando, ardova, conoil, 11plc, dangote fuel, toll, brt, lagos ferry, shuttlers

**Utilities & Bills (cat-03)**
Keywords (contains): dstv, gotv, startimes, phcn, ekedc, ikedc, aedc, ibdc, phed, kedco, enedco, bedc, jos electricity, spectranet, swift, smile, spectranet, nigerian water, lawma

**Airtime & Data (cat-04)**
Keywords (contains): airtel, mtn, glo, 9mobile, airtime, data bundle, etisalat, vtu, recharge

**Shopping (cat-09)**
Keywords (contains): jumia, konga, jiji, payporte, primark, zara, h&m, uniqlo, next, marks spencer, game, shoprite non-food, slot, pointek

**Entertainment (cat-10)**
Keywords (contains): netflix, showmax, dstv stream, audiomack, spotify, apple music, youtube premium, steam, playstation, xbox, silverbird, filmhouse, genesis cinemas

**Health (cat-11)**
Keywords (contains): pharmacy, chemist, hospital, clinic, medplus, healthplus, reddington, eko hospital, lagos island hospital, lagoon hospital, checkups, laboratory, lab

**Education (cat-12)**
Keywords (contains): school fees, university, tuition, waec, jamb, neco, coursera, udemy, alison, udacity, learning

**Salary Detection (cat-07) — Pattern Rule**
Apply when: `transaction_type = 'credit'` AND (`merchant_name` contains `salary` OR `payroll` OR `wages`) OR (the same employer name has sent a credit of similar amount on the same day of the month for at least 2 consecutive months).

---

## 4. Amount-Based Disambiguation

When the same merchant name can map to multiple categories, use amount range as a secondary signal:

**MTN/Airtel/Glo:**
- Amount ≤ ₦5,000 → Airtime & Data (cat-04)
- Amount > ₦5,000 → check for other signals; if none, Uncategorized

**Shoprite:**
- Amount ≤ ₦50,000 → Food & Dining (cat-01)
- Amount > ₦50,000 → Shopping (cat-09) (likely bulk purchase or non-food)

**Rent & Housing (cat-13):**
- Only apply to amounts ≥ ₦50,000 where the merchant name contains `rent`, `landlord`, `property`, `estate`, or `agent`
- Never assign cat-13 to small frequent debits

---

## 5. Self-Transfer Detection

A self-transfer is a debit from one of the user's accounts that is immediately matched by a credit of the same amount to another account.

**Detection logic:**
1. When a debit is parsed, check for a credit transaction matching within ±0.01 of the amount within a 10-minute window
2. If found, flag both records as `self_transfer: true`
3. Display both records in the transaction list with a "Internal Transfer" label
4. Exclude self-transfers from spending totals and category breakdowns

**Rule:** Self-transfers must never inflate spending totals. A transfer from First Bank to Kuda is not spending — it is movement. Failing to detect self-transfers causes dashboard figures to be inaccurate.

---

## 6. User Correction Behavior

When a user manually changes a transaction's category:

1. Save the new category to the transaction record immediately
2. Check if this merchant has been recategorized before (same merchant name, different category previously assigned automatically)
3. If yes, show prompt: **"Always categorize [Merchant] as [New Category]?"**
4. Three options: **Yes, always** | **Just this one** | **Cancel**

If user selects **Yes, always:**
- Create a new rule in the rules table: `match_type: 'exact'`, `keyword: merchantName`, `category_id: newCategoryId`, `priority: 100` (higher than all system rules), `is_system: false`
- Apply this rule to all past uncorrected transactions from the same merchant in a background job

**Rule conflict detection:**
If a new user rule would conflict with an existing user rule for the same merchant (same keyword, different category), surface this to the user:
> "You have a rule for [Merchant] that assigns it to [Old Category]. Do you want to replace it with [New Category]?"
Options: **Replace** | **Keep both** (not permitted — only one rule per exact keyword) | **Cancel**

**Rule:** Never silently apply a conflicting rule. Always ask the user to resolve the conflict explicitly.

---

## 7. Confidence and Review Flags

**Flag for review when:**
- Confidence is `low` (heuristic-based extraction)
- Category assigned is `Uncategorized`
- Amount is zero (blocked from auto-commit anyway)
- Transaction type could not be determined from the alert

**How flagged transactions appear:**
- Shown in the transaction list with a small review indicator (orange dot or "Review" chip)
- Accessible via a "Needs Review" filter in the transaction list
- Weekly summary notification includes count of unreviewed transactions

**Rule:** Flagged transactions are always committed to the database and visible to the user. They are never hidden or held in a queue. The flag is informational, not a gate.

---

## 8. What Categorization Never Does

- Never modifies the `amount`, `transaction_type`, `transaction_date`, or `merchant_name` fields
- Never deletes a transaction based on category confidence
- Never assigns a category based on the user's name, phone number, or personal information
- Never uses categories to make financial recommendations or judgments
- Never presents a category as certain when confidence is low — always shows the review indicator