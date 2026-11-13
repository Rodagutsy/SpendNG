import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  computeCapitalAllowances,
  computePersonalIncomeTax,
} = require('../tax-engine.ts') as typeof import('../tax-engine');

import type { CapitalAssetInput, TaxTransactionInput } from '../tax-engine';

const y2026 = new Date(2026, 5, 15).getTime();
const y2025 = new Date(2025, 5, 15).getTime();

test('YA 2026: Salaried PAYE employee matches NTA 2025 Fourth Schedule + Rent Relief', () => {
  const txns: TaxTransactionInput[] = [
    {
      id: 'sal-1',
      amount: 6_000_000,
      transactionType: 'credit',
      transactionDate: y2026,
      taxClassificationId: 'employment-income',
    },
    {
      id: 'pen-1',
      amount: 336_000,
      transactionType: 'debit',
      transactionDate: y2026,
      taxClassificationId: 'pension-contribution',
    },
    {
      id: 'nhf-1',
      amount: 60_000,
      transactionType: 'debit',
      transactionDate: y2026,
      taxClassificationId: 'nhf-contribution',
    },
    {
      id: 'rent-1',
      amount: 1_500_000,
      transactionType: 'debit',
      transactionDate: y2026,
      taxClassificationId: 'rent-paid',
    },
  ];

  const res = computePersonalIncomeTax({
    transactions: txns,
    profile: {
      incomeStreams: ['employment_paye'],
      isTenant: true,
      payeDeductedOverride: 744_720,
    },
    config: { taxYear: 2026 },
  });

  assert.equal(res.regime, 'NTA_2025');
  assert.equal(res.totalIncome, 6_000_000);
  assert.equal(res.eligibleDeductions.rentRelief, 300_000);
  assert.equal(res.eligibleDeductions.total, 696_000);
  assert.equal(res.chargeableIncome, 5_304_000);
  // 0% on 800k + 15% on 2.2m (330,000) + 18% on 2,304,000 (414,720) = 744,720
  assert.equal(res.grossTaxLiability, 744_720);
  assert.equal(res.netTaxPayable, 0);
});

test('YA 2026: Combined PAYE + Freelance + Creator with FX, WHT, Capital Allowance & s.120 Foreign Tax Credit', () => {
  const txns: TaxTransactionInput[] = [
    {
      id: 'sal',
      amount: 3_600_000,
      transactionType: 'credit',
      transactionDate: y2026,
      taxClassificationId: 'employment-income',
    },
    {
      id: 'upwork',
      amount: 9_000_000,
      originalCurrency: 'USD',
      originalAmount: 6_000,
      exchangeRate: 1_500,
      foreignTaxWithheld: 500_000,
      transactionType: 'credit',
      transactionDate: y2026,
      taxClassificationId: 'freelance-income',
    },
    {
      id: 'brand',
      amount: 2_000_000,
      whtAmount: 100_000,
      transactionType: 'credit',
      transactionDate: y2026,
      taxClassificationId: 'brand-deal',
    },
    {
      id: 'self-xfer',
      amount: 4_000_000,
      transactionType: 'credit',
      transactionDate: y2026,
      taxClassificationId: 'non-taxable-receipt',
    },
    {
      id: 'internet',
      amount: 400_000,
      businessUsePct: 50,
      vatChargedOrDutyPaid: true,
      transactionType: 'debit',
      transactionDate: y2026,
      taxClassificationId: 'business-expense',
    },
    {
      id: 'no-vat-exp',
      amount: 300_000,
      vatChargedOrDutyPaid: false,
      transactionType: 'debit',
      transactionDate: y2026,
      taxClassificationId: 'business-expense',
    },
    // 2025 tx should be ignored for YA 2026
    {
      id: 'old-2025',
      amount: 5_000_000,
      transactionType: 'credit',
      transactionDate: y2025,
      taxClassificationId: 'freelance-income',
    },
  ];

  const assets: CapitalAssetInput[] = [
    {
      id: 'cam',
      name: 'Sony A7 IV',
      assetClass: 'class_2_20pct',
      cost: 2_000_000,
      purchaseDate: y2026,
      vatPaid: true,
      businessUsePct: 100,
    },
  ];

  const res = computePersonalIncomeTax({
    transactions: txns,
    assets,
    profile: {
      incomeStreams: ['employment_paye', 'freelance', 'content_creator'],
      isTenant: true,
      annualRentOverride: 4_000_000, // 20% = 800k -> capped at 500k
      payeDeductedOverride: 200_000,
    },
    config: { taxYear: 2026 },
  });

  assert.equal(res.excludedNonTaxableTotal, 4_000_000);
  assert.equal(res.businessGrossIncome, 11_000_000);
  assert.equal(res.allowableBusinessExpenses, 200_000); // 50% of 400k
  assert.equal(res.disallowedVatExpenseTotal, 300_000); // s.21(p)
  assert.equal(res.capitalAllowancesTotal, 400_000); // 20% of 2m
  assert.equal(res.netBusinessProfit, 10_400_000);
  assert.equal(res.totalIncome, 14_000_000); // 3.6m + 10.4m
  assert.equal(res.eligibleDeductions.rentRelief, 500_000); // capped
  assert.equal(res.chargeableIncome, 13_500_000);
  // 0 + 330,000 + 1,620,000 + 21% of 1,500,000 (315,000) = 2,265,000
  assert.equal(res.grossTaxLiability, 2_265_000);
  assert.equal(res.credits.payeDeducted, 200_000);
  assert.equal(res.credits.whtCredits, 100_000);
  assert.equal(res.credits.foreignTaxCredit, 500_000); // under cap (9m/14m * 2,265,000 = 1,456,071.43)
  assert.equal(res.netTaxPayable, 1_465_000);
  assert.equal(res.foreignCurrencyBreakdown.length, 1);
  assert.equal(res.foreignCurrencyBreakdown[0].currency, 'USD');
});

test('YA 2026: Digital-asset losses are ring-fenced and cannot offset salary', () => {
  const txns: TaxTransactionInput[] = [
    {
      id: 'sal',
      amount: 3_000_000,
      transactionType: 'credit',
      transactionDate: y2026,
      taxClassificationId: 'employment-income',
    },
    {
      id: 'crypto-gain',
      amount: 200_000,
      transactionType: 'credit',
      transactionDate: y2026,
      taxClassificationId: 'digital-asset-gain',
    },
    {
      id: 'crypto-loss',
      amount: 500_000,
      transactionType: 'debit',
      transactionDate: y2026,
      taxClassificationId: 'digital-asset-loss',
    },
  ];

  const res = computePersonalIncomeTax({
    transactions: txns,
    profile: { incomeStreams: ['employment_paye'], isTenant: false },
    config: { taxYear: 2026 },
  });

  assert.equal(res.digitalAssetNetGain, 0);
  assert.equal(res.digitalAssetLossCarryForward, 300_000);
  assert.equal(res.totalIncome, 3_000_000); // salary untouched
  assert.equal(res.eligibleDeductions.rentRelief, 0); // not a tenant
});

test('Capital allowances retain 1% statistical residual and reject unpaid VAT assets', () => {
  const res = computeCapitalAllowances(
    [
      {
        id: 'a1',
        name: 'MacBook Pro',
        assetClass: 'class_2_20pct',
        cost: 1_000_000,
        purchaseDate: y2026,
        vatPaid: true,
        yearsPreviouslyClaimed: 4, // 80% already claimed, 20% left but 1% must stay
      },
      {
        id: 'a2',
        name: 'No-VAT Camera',
        assetClass: 'class_2_20pct',
        cost: 500_000,
        purchaseDate: y2026,
        vatPaid: false,
      },
    ],
    2026,
  );

  assert.equal(res.total, 190_000); // 19% instead of 20%, leaving 10,000 (1%)
  assert.equal(res.schedule[0].statisticalResidual, 10_000);
  assert.equal(res.schedule[1].allowanceClaimed, 0);
  assert.ok(res.warnings.length === 1);
});

test('YA 2026: Minimum wage earner is exempt', () => {
  const res = computePersonalIncomeTax({
    transactions: [
      {
        id: 'min-sal',
        amount: 840_000,
        transactionType: 'credit',
        transactionDate: y2026,
        taxClassificationId: 'employment-income',
      },
    ],
    profile: { incomeStreams: ['employment_paye'], isTenant: false },
    config: { taxYear: 2026 },
  });

  assert.equal(res.minimumWageExempt, true);
  assert.equal(res.grossTaxLiability, 0);
});

test('YA 2025: Legacy PITA applies CRA, 7%-24% bands, and 1% minimum tax', () => {
  const res = computePersonalIncomeTax({
    transactions: [
      {
        id: 'sal-25',
        amount: 600_000,
        transactionType: 'credit',
        transactionDate: y2025,
        taxClassificationId: 'employment-income',
      },
    ],
    profile: { incomeStreams: ['employment_paye'], isTenant: true, annualRentOverride: 200_000 },
    config: { taxYear: 2025 },
  });

  assert.equal(res.regime, 'PITA_LEGACY');
  // CRA = max(200k, 6k) + 20% * 600k = 320,000; chargeable = 280,000; 7% = 19,600; min tax = 6,000
  assert.equal(res.eligibleDeductions.cra, 320_000);
  assert.equal(res.eligibleDeductions.rentRelief, 0); // no Rent Relief in 2025
  assert.equal(res.grossTaxLiability, 19_600);
});

