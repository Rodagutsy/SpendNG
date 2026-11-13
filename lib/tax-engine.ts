/**
 * SpendNG Nigerian Personal Income Tax (PIT) Engine
 *
 * Statutory basis:
 * - YA 2026+: Nigeria Tax Act, 2025 (NTA, Act No. 7) & Nigeria Tax Administration Act, 2025 (NTAA, Act No. 5)
 * - YA 2025:  Personal Income Tax Act (PITA) transition rules for 2025 income filed in 2026
 *
 * Pure TypeScript module with zero UI/runtime dependencies.
 */

export type IncomeStream =
  | 'employment_paye'
  | 'freelance'
  | 'content_creator'
  | 'sole_proprietor';

export type CapitalAssetClass = 'class_1_10pct' | 'class_2_20pct' | 'class_3_25pct';

export type TaxDirection = 'income' | 'expense';

export interface TaxConfig {
  taxYear: number;
  annualMinimumWage: number; // ₦840,000 (₦70,000 × 12)
  rentReliefRate: number;    // 0.20 (NTA s. 30(2)(a)(vi))
  rentReliefCap: number;     // ₦500,000
}

export const DEFAULT_TAX_CONFIG: TaxConfig = {
  taxYear: new Date().getFullYear(),
  annualMinimumWage: 840_000,
  rentReliefRate: 0.20,
  rentReliefCap: 500_000,
};

export interface TaxTransactionInput {
  id: string;
  amount: number; // NGN equivalent (already converted at CBN/tx rate)
  transactionType: 'credit' | 'debit';
  transactionDate: number; // epoch ms
  taxClassificationId: string | null;
  isDuplicate?: boolean;
  originalCurrency?: string | null;
  originalAmount?: number | null;
  exchangeRate?: number | null;
  whtAmount?: number | null;
  foreignTaxWithheld?: number | null;
  vatChargedOrDutyPaid?: boolean | null; // null/undefined treated as true unless explicitly false
  businessUsePct?: number | null;       // 0..100, default 100
  merchantName?: string | null;
}

export interface CapitalAssetInput {
  id: string;
  name: string;
  assetClass: CapitalAssetClass;
  cost: number;
  purchaseDate: number; // epoch ms
  vatPaid: boolean;
  businessUsePct?: number; // 0..100, default 100
  yearsPreviouslyClaimed?: number; // default 0
  disposedAt?: number | null;
}

export interface WhtCreditInput {
  id: string;
  clientName: string;
  grossAmount: number;
  whtAmount: number;
  transactionDate: number;
  transactionId?: string | null;
}

export interface TaxProfileInput {
  incomeStreams: IncomeStream[];
  isTenant: boolean;
  annualRentOverride?: number | null;
  payeDeductedOverride?: number | null;
  pensionOverride?: number | null;
  nhfOverride?: number | null;
  nhisOverride?: number | null;
  lifeAssuranceOverride?: number | null;
  mortgageInterestOverride?: number | null;
  priorYearBusinessLoss?: number | null;
  priorYearDigitalAssetLoss?: number | null;
}

export interface TaxBandSlice {
  label: string;
  rate: number;
  taxableInBand: number;
  taxInBand: number;
}

export interface CapitalAllowanceLine {
  assetId: string;
  name: string;
  assetClass: CapitalAssetClass;
  rate: number;
  qualifyingCost: number;
  allowanceClaimed: number;
  statisticalResidual: number;
  disallowedReason?: string;
}

export interface ForeignCurrencySummary {
  currency: string;
  originalTotal: number;
  ngnTotal: number;
  foreignTaxWithheldNgn: number;
}

export interface TaxComputationResult {
  taxYear: number;
  regime: 'NTA_2025' | 'PITA_LEGACY';

  // Income breakdown (NGN)
  employmentIncome: number;
  businessGrossIncome: number; // business + freelance + creator + brand deals
  rentalIncome: number;
  investmentIncome: number;
  otherTaxableIncome: number;
  digitalAssetNetGain: number;
  digitalAssetLossCarryForward: number;
  excludedNonTaxableTotal: number;
  excludedFinalWhtInterestTotal: number;
  totalBankCredits: number;
  grossReportableIncome: number;

  // Business deductions & Capital Allowances
  allowableBusinessExpenses: number;
  disallowedVatExpenseTotal: number;
  capitalAllowancesTotal: number;
  capitalAllowanceSchedule: CapitalAllowanceLine[];
  netBusinessProfit: number;
  businessLossCarryForward: number;

  // Total & Chargeable Income
  totalIncome: number;
  eligibleDeductions: {
    cra: number; // > 0 only in PITA_LEGACY (YA <= 2025)
    rentPaid: number;
    rentRelief: number;
    pension: number;
    nhf: number;
    nhis: number;
    lifeAssurance: number;
    mortgageInterest: number;
    total: number;
  };
  chargeableIncome: number;

  // Tax Bands & Liability
  minimumWageExempt: boolean;
  minimumTaxApplied: boolean; // PITA_LEGACY only
  bandBreakdown: TaxBandSlice[];
  grossTaxLiability: number;

  // Tax Credits
  credits: {
    payeDeducted: number;
    whtCredits: number;
    foreignTaxCredit: number;
    foreignTaxCreditCap: number;
    totalCredits: number;
  };

  // Final Result
  netTaxPayable: number;
  taxRefundable: number;
  effectiveTaxRate: number; // 0..1

  // Foreign currency & Audit warnings
  foreignCurrencyBreakdown: ForeignCurrencySummary[];
  unclassifiedCreditCount: number;
  unclassifiedCreditTotal: number;
  unclassifiedDebitCount: number;
  warnings: string[];
}

export const CAPITAL_ALLOWANCE_RATES: Record<CapitalAssetClass, number> = {
  class_1_10pct: 0.10,
  class_2_20pct: 0.20,
  class_3_25pct: 0.25,
};

const NTA_2025_BANDS: { label: string; limit: number; rate: number }[] = [
  { label: 'First ₦800,000', limit: 800_000, rate: 0.00 },
  { label: 'Next ₦2,200,000', limit: 2_200_000, rate: 0.15 },
  { label: 'Next ₦9,000,000', limit: 9_000_000, rate: 0.18 },
  { label: 'Next ₦13,000,000', limit: 13_000_000, rate: 0.21 },
  { label: 'Next ₦25,000,000', limit: 25_000_000, rate: 0.23 },
  { label: 'Above ₦50,000,000', limit: Infinity, rate: 0.25 },
];

const PITA_LEGACY_BANDS: { label: string; limit: number; rate: number }[] = [
  { label: 'First ₦300,000', limit: 300_000, rate: 0.07 },
  { label: 'Next ₦300,000', limit: 300_000, rate: 0.11 },
  { label: 'Next ₦500,000', limit: 500_000, rate: 0.15 },
  { label: 'Next ₦500,000', limit: 500_000, rate: 0.19 },
  { label: 'Next ₦1,600,000', limit: 1_600_000, rate: 0.21 },
  { label: 'Above ₦3,200,000', limit: Infinity, rate: 0.24 },
];

const BUSINESS_INCOME_CLASSES = new Set([
  'business-income',
  'freelance-income',
  'creator-platform',
  'brand-deal',
]);

const clampPct = (pct: number | null | undefined): number => {
  if (pct === null || pct === undefined || Number.isNaN(pct)) return 100;
  return Math.max(0, Math.min(100, pct));
};

const round2 = (n: number): number => Math.round(n * 100) / 100;

export function applyProgressiveBands(
  chargeableIncome: number,
  bands: { label: string; limit: number; rate: number }[],
): { totalTax: number; breakdown: TaxBandSlice[] } {
  let remaining = Math.max(0, chargeableIncome);
  let totalTax = 0;
  const breakdown: TaxBandSlice[] = [];

  for (const band of bands) {
    if (remaining <= 0) {
      breakdown.push({ label: band.label, rate: band.rate, taxableInBand: 0, taxInBand: 0 });
      continue;
    }
    const taxableInBand = band.limit === Infinity ? remaining : Math.min(remaining, band.limit);
    const taxInBand = round2(taxableInBand * band.rate);
    totalTax = round2(totalTax + taxInBand);
    remaining = round2(remaining - taxableInBand);
    breakdown.push({ label: band.label, rate: band.rate, taxableInBand, taxInBand });
  }

  return { totalTax, breakdown };
}

export function computeCapitalAllowances(
  assets: CapitalAssetInput[],
  taxYear: number,
): { total: number; schedule: CapitalAllowanceLine[]; warnings: string[] } {
  const yearEnd = new Date(taxYear, 11, 31, 23, 59, 59, 999).getTime();
  const yearStart = new Date(taxYear, 0, 1, 0, 0, 0, 0).getTime();
  const schedule: CapitalAllowanceLine[] = [];
  const warnings: string[] = [];
  let total = 0;

  for (const asset of assets) {
    if (asset.purchaseDate > yearEnd) continue;
    if (asset.disposedAt && asset.disposedAt < yearStart) continue;

    const rate = CAPITAL_ALLOWANCE_RATES[asset.assetClass];
    const useRatio = clampPct(asset.businessUsePct) / 100;
    const qualifyingCost = round2(asset.cost * useRatio);

    if (!asset.vatPaid) {
      warnings.push(
        `Capital asset "${asset.name}" is ineligible for capital allowance because VAT/import duty was not paid (NTA s. 27(2)).`,
      );
      schedule.push({
        assetId: asset.id,
        name: asset.name,
        assetClass: asset.assetClass,
        rate,
        qualifyingCost,
        allowanceClaimed: 0,
        statisticalResidual: qualifyingCost,
        disallowedReason: 'VAT/duty not paid (NTA s. 27(2))',
      });
      continue;
    }

    const totalYears = Math.round(1 / rate);
    const claimedYears = Math.max(0, asset.yearsPreviouslyClaimed ?? 0);
    // NTA First Schedule, para 6(a): retain 1% statistical residual until disposal
    const maxTotalClaimable = round2(qualifyingCost * 0.99);
    const previouslyClaimed = round2(Math.min(maxTotalClaimable, qualifyingCost * rate * claimedYears));
    const remainingClaimable = Math.max(0, round2(maxTotalClaimable - previouslyClaimed));

    let allowanceClaimed = 0;
    if (claimedYears < totalYears && remainingClaimable > 0) {
      allowanceClaimed = Math.min(round2(qualifyingCost * rate), remainingClaimable);
    }

    const statisticalResidual = round2(qualifyingCost - previouslyClaimed - allowanceClaimed);
    total = round2(total + allowanceClaimed);

    schedule.push({
      assetId: asset.id,
      name: asset.name,
      assetClass: asset.assetClass,
      rate,
      qualifyingCost,
      allowanceClaimed,
      statisticalResidual,
    });
  }

  return { total, schedule, warnings };
}

export function computePersonalIncomeTax(params: {
  transactions: TaxTransactionInput[];
  assets?: CapitalAssetInput[];
  whtCredits?: WhtCreditInput[];
  profile: TaxProfileInput;
  config?: Partial<TaxConfig>;
}): TaxComputationResult {
  const config: TaxConfig = { ...DEFAULT_TAX_CONFIG, ...params.config };
  const { taxYear } = config;
  const regime: 'NTA_2025' | 'PITA_LEGACY' = taxYear >= 2026 ? 'NTA_2025' : 'PITA_LEGACY';

  const yearStart = new Date(taxYear, 0, 1, 0, 0, 0, 0).getTime();
  const yearEnd = new Date(taxYear, 11, 31, 23, 59, 59, 999).getTime();

  const yearTxns = params.transactions.filter(
    (t) => !t.isDuplicate && t.transactionDate >= yearStart && t.transactionDate <= yearEnd,
  );

  const warnings: string[] = [];

  // --- 1. Aggregate Income & Foreign Currency ---
  let employmentIncome = 0;
  let businessGrossIncome = 0;
  let rentalIncome = 0;
  let investmentIncome = 0;
  let otherTaxableIncome = 0;
  let digitalAssetGains = 0;
  let excludedNonTaxableTotal = 0;
  let excludedFinalWhtInterestTotal = 0;
  let totalBankCredits = 0;
  let unclassifiedCreditCount = 0;
  let unclassifiedCreditTotal = 0;
  let txLevelWht = 0;
  let totalForeignTaxWithheldNgn = 0;
  let foreignIncomeNgn = 0;

  const fxMap = new Map<string, ForeignCurrencySummary>();
  const linkedWhtTxIds = new Set(
    (params.whtCredits ?? []).map((w) => w.transactionId).filter((id): id is string => Boolean(id)),
  );

  for (const t of yearTxns) {
    if (t.transactionType !== 'credit') continue;
    totalBankCredits = round2(totalBankCredits + t.amount);

    const cls = t.taxClassificationId;
    if (!cls) {
      unclassifiedCreditCount++;
      unclassifiedCreditTotal = round2(unclassifiedCreditTotal + t.amount);
      continue;
    }

    if (cls === 'non-taxable-receipt') {
      excludedNonTaxableTotal = round2(excludedNonTaxableTotal + t.amount);
      continue;
    }

    if (cls === 'final-wht-interest') {
      excludedFinalWhtInterestTotal = round2(excludedFinalWhtInterestTotal + t.amount);
      continue;
    }

    if (cls === 'employment-income') employmentIncome = round2(employmentIncome + t.amount);
    else if (BUSINESS_INCOME_CLASSES.has(cls)) businessGrossIncome = round2(businessGrossIncome + t.amount);
    else if (cls === 'rental-income') rentalIncome = round2(rentalIncome + t.amount);
    else if (cls === 'investment-income') investmentIncome = round2(investmentIncome + t.amount);
    else if (cls === 'digital-asset-gain') digitalAssetGains = round2(digitalAssetGains + t.amount);
    else otherTaxableIncome = round2(otherTaxableIncome + t.amount);

    if (t.whtAmount && t.whtAmount > 0 && !linkedWhtTxIds.has(t.id)) {
      txLevelWht = round2(txLevelWht + t.whtAmount);
    }

    const foreignTax = Math.max(0, t.foreignTaxWithheld ?? 0);
    totalForeignTaxWithheldNgn = round2(totalForeignTaxWithheldNgn + foreignTax);

    if (t.originalCurrency && t.originalCurrency.toUpperCase() !== 'NGN') {
      const ccy = t.originalCurrency.toUpperCase();
      foreignIncomeNgn = round2(foreignIncomeNgn + t.amount);
      const existing = fxMap.get(ccy) ?? {
        currency: ccy,
        originalTotal: 0,
        ngnTotal: 0,
        foreignTaxWithheldNgn: 0,
      };
      existing.originalTotal = round2(existing.originalTotal + (t.originalAmount ?? 0));
      existing.ngnTotal = round2(existing.ngnTotal + t.amount);
      existing.foreignTaxWithheldNgn = round2(existing.foreignTaxWithheldNgn + foreignTax);
      fxMap.set(ccy, existing);
    }
  }

  // --- 2. Aggregate Expenses, Digital Asset Losses & Reliefs ---
  let allowableBusinessExpenses = 0;
  let disallowedVatExpenseTotal = 0;
  let digitalAssetLosses = Math.max(0, params.profile.priorYearDigitalAssetLoss ?? 0);
  let unclassifiedDebitCount = 0;
  let rentPaidFromTx = 0;
  let pensionFromTx = 0;
  let nhfFromTx = 0;
  let nhisFromTx = 0;
  let lifeAssuranceFromTx = 0;
  let mortgageInterestFromTx = 0;
  let taxPaidFromTx = 0;

  for (const t of yearTxns) {
    if (t.transactionType !== 'debit') continue;
    const cls = t.taxClassificationId;
    if (!cls) {
      unclassifiedDebitCount++;
      continue;
    }

    if (cls === 'business-expense') {
      const usable = round2(t.amount * (clampPct(t.businessUsePct) / 100));
      if (t.vatChargedOrDutyPaid === false) {
        disallowedVatExpenseTotal = round2(disallowedVatExpenseTotal + usable);
      } else {
        allowableBusinessExpenses = round2(allowableBusinessExpenses + usable);
      }
    } else if (cls === 'digital-asset-loss') {
      digitalAssetLosses = round2(digitalAssetLosses + t.amount);
    } else if (cls === 'rent-paid') {
      rentPaidFromTx = round2(rentPaidFromTx + t.amount);
    } else if (cls === 'pension-contribution') {
      pensionFromTx = round2(pensionFromTx + t.amount);
    } else if (cls === 'nhf-contribution') {
      nhfFromTx = round2(nhfFromTx + t.amount);
    } else if (cls === 'nhis-hmo') {
      nhisFromTx = round2(nhisFromTx + t.amount);
    } else if (cls === 'life-assurance') {
      lifeAssuranceFromTx = round2(lifeAssuranceFromTx + t.amount);
    } else if (cls === 'mortgage-interest') {
      mortgageInterestFromTx = round2(mortgageInterestFromTx + t.amount);
    } else if (cls === 'tax-paid') {
      taxPaidFromTx = round2(taxPaidFromTx + t.amount);
    }
  }

  if (disallowedVatExpenseTotal > 0) {
    warnings.push(
      `₦${disallowedVatExpenseTotal.toLocaleString()} in business expenses disallowed because VAT/import duty was marked unpaid (NTA s. 21(p)).`,
    );
  }
  if (unclassifiedCreditCount > 0) {
    warnings.push(
      `${unclassifiedCreditCount} credit transaction(s) (₦${unclassifiedCreditTotal.toLocaleString()}) are unclassified and excluded until reviewed.`,
    );
  }

  // --- 3. Capital Allowances & Business Profit ---
  const capResult = computeCapitalAllowances(params.assets ?? [], taxYear);
  warnings.push(...capResult.warnings);

  const priorBizLoss = Math.max(0, params.profile.priorYearBusinessLoss ?? 0);
  const rawBusinessResult = round2(
    businessGrossIncome - allowableBusinessExpenses - capResult.total - priorBizLoss,
  );
  const netBusinessProfit = Math.max(0, rawBusinessResult);
  const businessLossCarryForward = rawBusinessResult < 0 ? Math.abs(rawBusinessResult) : 0;

  // --- 4. Digital-Asset Loss Ring-Fencing (NTA s. 28(3)(iv)) ---
  const digitalAssetNetGain = Math.max(0, round2(digitalAssetGains - digitalAssetLosses));
  const digitalAssetLossCarryForward =
    digitalAssetLosses > digitalAssetGains ? round2(digitalAssetLosses - digitalAssetGains) : 0;

  const grossReportableIncome = round2(
    employmentIncome +
      businessGrossIncome +
      rentalIncome +
      investmentIncome +
      otherTaxableIncome +
      digitalAssetGains,
  );

  const totalIncome = round2(
    employmentIncome +
      netBusinessProfit +
      rentalIncome +
      investmentIncome +
      otherTaxableIncome +
      digitalAssetNetGain,
  );

  // --- 5. Eligible Deductions / Reliefs ---
  const rentPaid = Math.max(0, params.profile.annualRentOverride ?? rentPaidFromTx);
  const rentRelief =
    regime === 'NTA_2025' && params.profile.isTenant
      ? round2(Math.min(rentPaid * config.rentReliefRate, config.rentReliefCap))
      : 0;

  const pension = Math.max(0, params.profile.pensionOverride ?? pensionFromTx);
  const nhf = Math.max(0, params.profile.nhfOverride ?? nhfFromTx);
  const nhis = Math.max(0, params.profile.nhisOverride ?? nhisFromTx);
  const lifeAssurance = Math.max(0, params.profile.lifeAssuranceOverride ?? lifeAssuranceFromTx);
  const mortgageInterest = Math.max(
    0,
    params.profile.mortgageInterestOverride ?? mortgageInterestFromTx,
  );

  const cra =
    regime === 'PITA_LEGACY' && totalIncome > 0
      ? round2(Math.max(200_000, 0.01 * totalIncome) + 0.20 * totalIncome)
      : 0;

  const eligibleTotal = round2(
    cra + rentRelief + pension + nhf + nhis + lifeAssurance + mortgageInterest,
  );
  const chargeableIncome = Math.max(0, round2(totalIncome - eligibleTotal));

  // --- 6. Apply Tax Bands ---
  const onlyEmployment =
    employmentIncome > 0 &&
    netBusinessProfit === 0 &&
    rentalIncome === 0 &&
    investmentIncome === 0 &&
    otherTaxableIncome === 0 &&
    digitalAssetNetGain === 0;

  const minimumWageExempt =
    regime === 'NTA_2025' && onlyEmployment && employmentIncome <= config.annualMinimumWage;

  let bandBreakdown: TaxBandSlice[] = [];
  let grossTaxLiability = 0;
  let minimumTaxApplied = false;

  if (!minimumWageExempt && chargeableIncome > 0) {
    const bands = regime === 'NTA_2025' ? NTA_2025_BANDS : PITA_LEGACY_BANDS;
    const applied = applyProgressiveBands(chargeableIncome, bands);
    bandBreakdown = applied.breakdown;
    grossTaxLiability = applied.totalTax;

    if (regime === 'PITA_LEGACY') {
      const minTax = round2(0.01 * totalIncome);
      if (minTax > grossTaxLiability) {
        grossTaxLiability = minTax;
        minimumTaxApplied = true;
      }
    }
  } else {
    const bands = regime === 'NTA_2025' ? NTA_2025_BANDS : PITA_LEGACY_BANDS;
    bandBreakdown = bands.map((b) => ({
      label: b.label,
      rate: b.rate,
      taxableInBand: 0,
      taxInBand: 0,
    }));
  }

  // --- 7. Credits: PAYE, WHT, Unilateral Foreign Tax Credit (NTA s. 120) ---
  const payeDeducted = Math.max(0, params.profile.payeDeductedOverride ?? taxPaidFromTx);

  const yearWhtList = (params.whtCredits ?? []).filter(
    (w) => w.transactionDate >= yearStart && w.transactionDate <= yearEnd,
  );
  const whtCredits = round2(
    yearWhtList.reduce((sum, w) => sum + Math.max(0, w.whtAmount), 0) + txLevelWht,
  );

  const foreignTaxCreditCap =
    totalIncome > 0 && foreignIncomeNgn > 0 && grossTaxLiability > 0
      ? round2((Math.min(foreignIncomeNgn, totalIncome) / totalIncome) * grossTaxLiability)
      : 0;
  const foreignTaxCredit = round2(Math.min(totalForeignTaxWithheldNgn, foreignTaxCreditCap));

  const totalCredits = round2(payeDeducted + whtCredits + foreignTaxCredit);
  const netTaxPayable = Math.max(0, round2(grossTaxLiability - totalCredits));
  const taxRefundable = totalCredits > grossTaxLiability ? round2(totalCredits - grossTaxLiability) : 0;
  const effectiveTaxRate = totalIncome > 0 ? grossTaxLiability / totalIncome : 0;

  return {
    taxYear,
    regime,
    employmentIncome,
    businessGrossIncome,
    rentalIncome,
    investmentIncome,
    otherTaxableIncome,
    digitalAssetNetGain,
    digitalAssetLossCarryForward,
    excludedNonTaxableTotal,
    excludedFinalWhtInterestTotal,
    totalBankCredits,
    grossReportableIncome,
    allowableBusinessExpenses,
    disallowedVatExpenseTotal,
    capitalAllowancesTotal: capResult.total,
    capitalAllowanceSchedule: capResult.schedule,
    netBusinessProfit,
    businessLossCarryForward,
    totalIncome,
    eligibleDeductions: {
      cra,
      rentPaid,
      rentRelief,
      pension,
      nhf,
      nhis,
      lifeAssurance,
      mortgageInterest,
      total: eligibleTotal,
    },
    chargeableIncome,
    minimumWageExempt,
    minimumTaxApplied,
    bandBreakdown,
    grossTaxLiability,
    credits: {
      payeDeducted,
      whtCredits,
      foreignTaxCredit,
      foreignTaxCreditCap,
      totalCredits,
    },
    netTaxPayable,
    taxRefundable,
    effectiveTaxRate,
    foreignCurrencyBreakdown: Array.from(fxMap.values()),
    unclassifiedCreditCount,
    unclassifiedCreditTotal,
    unclassifiedDebitCount,
    warnings,
  };
}

