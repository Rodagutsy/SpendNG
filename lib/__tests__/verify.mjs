import { Parser } from '../parser.ts';

const debug = false;

function runTest(label, body, sender, timestamp, expected) {
  const result = Parser.parseSMS(body, sender, timestamp, debug);
  
  if (expected.expectNull) {
    if (result !== null) {
      console.log(`FAIL ${label}: expected null but got result`);
      return false;
    }
    console.log(`PASS ${label}: correctly returned null`);
    return true;
  }

  if (result === null) {
    console.log(`FAIL ${label}: expected parsed transaction but got null`);
    return false;
  }

  let ok = true;
  const errors = [];
  
  if (expected.amount !== undefined && result.amount !== expected.amount) {
    errors.push(`amount expected ${expected.amount}, got ${result.amount}`);
    ok = false;
  }
  if (expected.type !== undefined && result.transactionType !== expected.type) {
    errors.push(`type expected ${expected.type}, got ${result.transactionType}`);
    ok = false;
  }
  if (expected.merchantContains !== undefined && 
      (!result.merchantName || !result.merchantName.toLowerCase().includes(expected.merchantContains.toLowerCase()))) {
    errors.push(`merchant should contain "${expected.merchantContains}", got "${result.merchantName}"`);
    ok = false;
  }
  if (expected.balance !== undefined && result.availableBalance !== expected.balance) {
    errors.push(`balance expected ${expected.balance}, got ${result.availableBalance}`);
    ok = false;
  }
  if (expected.last4 !== undefined && result.accountNumberLast4 !== expected.last4) {
    errors.push(`last4 expected ${expected.last4}, got ${result.accountNumberLast4}`);
    ok = false;
  }
  if (expected.confidence !== undefined && result.parseConfidence !== expected.confidence) {
    errors.push(`confidence expected ${expected.confidence}, got ${result.parseConfidence}`);
    ok = false;
  }

  if (ok) {
    console.log(`PASS ${label}: amt=${result.amount} type=${result.transactionType} merchant="${result.merchantName}" bal=${result.availableBalance} #${result.accountNumberLast4} conf=${result.parseConfidence}`);
  } else {
    console.log(`FAIL ${label}: ${errors.join(', ')}`);
  }
  return ok;
}

let passed = 0;
let failed = 0;
function check(label, body, sender, timestamp, expected) {
  if (runTest(label, body, sender, timestamp, expected)) passed++;
  else failed++;
}

const NOW = Date.now();

console.log('\n=== USER SAMPLES ===\n');

check('GTBank debit (user sample)', 
  `Acct: ****3640\nAmt: NGN800.00 DR\nDesc: NIP TRANSFER TO OPAY - CHUKWUDI OGBONNA OKORO\nAvail Bal: NGN318.37\nDate: 2026-06-12 8:21:47 PM`,
  'GTBank', NOW,
  { amount: 800, type: 'debit', merchantContains: 'NIP TRANSFER', balance: 318.37, last4: '3640', confidence: 'high' });

check('FirstBank credit (user sample)',
  'Credit: 311XXXX746 Amt: NGN2,000.00 Date: 02-MAY-2026 07:59:43 Desc: FIP:GTB/DIYAOLU RIDWAN OLA/NIP Transfer . Bal: NGN5,630.25CR Pay with FirstOnline',
  'FIRSTBANK', NOW,
  { amount: 2000, type: 'credit', merchantContains: 'FIP:GTB/DIYAOLU', balance: 5630.25, last4: '746', confidence: 'high' });

console.log('\n=== GTBank FORMATS ===\n');

check('GTBank standard debit',
  `Acct: 123****456\nAmt: NGN5,000.00 DR\nDesc: POS WITHDRAWAL\nAvail Bal: NGN10,000.00\nDate: 12-MAR-2026 14:30:00`,
  'GTBank', NOW,
  { amount: 5000, type: 'debit', merchantContains: 'POS WITHDRAWAL', balance: 10000, last4: '456', confidence: 'high' });

check('GTBank credit',
  `Acct: 123****456\nAmt: NGN15,000.00 CR\nDesc: Transfer from JOHN DOE\nAvail Bal: NGN25,000.00\nDate: 15-MAR-2026 09:15:00`,
  'GTBank', NOW,
  { amount: 15000, type: 'credit', merchantContains: 'JOHN DOE', balance: 25000, last4: '456', confidence: 'high' });

check('GTBank no NGN prefix',
  `Acct: 123****456\nAmt: 3,200.00 DR\nDesc: WEB PAYMENT\nAvail Bal: 7,800.00\nDate: 20-JAN-2026 11:00:00`,
  'GTBank', NOW,
  { amount: 3200, type: 'debit', merchantContains: 'WEB PAYMENT', balance: 7800, last4: '456', confidence: 'high' });

check('GTBank ****3640 credit',
  `Acct: ****3640\nAmt: NGN1,200.00 CR\nDesc: Transfer from MARY JANE\nAvail Bal: NGN5,400.00\nDate: 10-APR-2026 16:45:00`,
  'GTB', NOW,
  { amount: 1200, type: 'credit', merchantContains: 'MARY JANE', balance: 5400, last4: '3640', confidence: 'high' });

console.log('\n=== FirstBank FORMATS ===\n');

check('FirstBank single-line credit',
  'Credit: 311XXXX746 Amt: NGN3,500.00 Date: 15-JUN-2026 12:30:00 Desc: Transfer from OLU . Bal: NGN12,000.25CR',
  'FIRSTBANK', NOW,
  { amount: 3500, type: 'credit', merchantContains: 'OLU', balance: 12000.25, last4: '746', confidence: 'high' });

check('FirstBank debit',
  'Debit: 311XXXX222 Amt: NGN8,000.00 Date: 10-MAY-2026 08:20:15 Desc: POS PURCHASE . Bal: NGN20,000.00DR',
  'FirstBank', NOW,
  { amount: 8000, type: 'debit', merchantContains: 'POS PURCHASE', balance: 20000, last4: '222', confidence: 'high' });

console.log('\n=== Access Bank ===\n');

check('Access Bank debit',
  `Acct: 123****789\nAmt: NGN6,500.00\nDate: 05/04/2026 10:30:00\nDesc: POS ATM\nAvail Bal: NGN45,000.00\nDEBIT ALERT`,
  'ACCESS', NOW,
  { amount: 6500, type: 'debit', merchantContains: 'POS ATM', balance: 45000, last4: '789', confidence: 'high' });

check('Access Bank credit',
  `Acct: 123****789\nAmt: NGN25,000.00\nDate: 06/04/2026 14:00:00\nFrom: SALARY PAYMENT\nAvail Bal: NGN70,000.00\nCREDIT ALERT`,
  'AccessBank', NOW,
  { amount: 25000, type: 'credit', merchantContains: 'SALARY PAYMENT', balance: 70000, last4: '789', confidence: 'high' });

console.log('\n=== Zenith Bank ===\n');

check('Zenith Bank debit',
  `Acct: 456****789\nDR: NGN12,000.00\nDesc: TRANSFER TO CHIDI\nAvail Bal: NGN88,000.00\nDate: 22-MAR-2026 15:45:00`,
  'ZENITH', NOW,
  { amount: 12000, type: 'debit', merchantContains: 'CHIDI', balance: 88000, last4: '789', confidence: 'high' });

check('Zenith Bank credit',
  `Acct: 456****789\nCR: NGN30,000.00\nDesc: SALARY\nAvail Bal: NGN118,000.00\nDate: 25-MAR-2026 08:00:00`,
  'AlertZ', NOW,
  { amount: 30000, type: 'credit', merchantContains: 'SALARY', balance: 118000, last4: '789', confidence: 'high' });

console.log('\n=== UBA ===\n');

check('UBA debit',
  `Acct: 789****012\nDebit Amt: NGN4,200.00\nDate: 10-FEB-2026 12:00:00\nFrom: POS DEBIT\nAvail Bal: NGN15,800.00`,
  'UBA', NOW,
  { amount: 4200, type: 'debit', merchantContains: 'POS DEBIT', balance: 15800, last4: '012', confidence: 'high' });

check('UBA credit',
  `Acct: 789****012\nCredit Amt: NGN50,000.00\nDate: 12-FEB-2026 09:30:00\nDesc: TRANSFER FROM PARENT\nAvail Bal: NGN65,800.00`,
  'UBAGroup', NOW,
  { amount: 50000, type: 'credit', merchantContains: 'PARENT', balance: 65800, last4: '012', confidence: 'high' });

console.log('\n=== FCMB ===\n');

check('FCMB debit',
  `Acct: 321****654\nDebit: NGN3,000.00\nDate: 05-MAY-2026\nDesc: ATM WITHDRAWAL\nAvail Bal: NGN22,000.00`,
  'FCMB', NOW,
  { amount: 3000, type: 'debit', merchantContains: 'ATM WITHDRAWAL', balance: 22000, last4: '654', confidence: 'high' });

check('FCMB credit',
  `Acct: 321****654\nCredit: NGN10,000.00\nDate: 06-MAY-2026\nDesc: TRANSFER FROM BOSS\nAvail Bal: NGN32,000.00`,
  'FCMBank', NOW,
  { amount: 10000, type: 'credit', merchantContains: 'BOSS', balance: 32000, last4: '654', confidence: 'high' });

console.log('\n=== Fidelity Bank ===\n');

check('Fidelity Bank debit',
  `Acct: 654****321\nDR: NGN9,500.00\nDate: 15/04/2026\nDesc: ONLINE PURCHASE\nAvail Bal: NGN40,500.00`,
  'FIDELITY', NOW,
  { amount: 9500, type: 'debit', merchantContains: 'ONLINE PURCHASE', balance: 40500, last4: '321', confidence: 'high' });

check('Fidelity Bank credit',
  `Acct: 654****321\nCR: NGN20,000.00\nDate: 16/04/2026\nDesc: REFUND\nAvail Bal: NGN60,500.00`,
  'Fidelity', NOW,
  { amount: 20000, type: 'credit', merchantContains: 'REFUND', balance: 60500, last4: '321', confidence: 'high' });

console.log('\n=== Wema Bank ===\n');

check('Wema Bank debit',
  `Acct: 987****123\nDR NGN2,500.00\nNarration: POS PURCHASE\nAvail Bal: NGN27,500.00\nDate: 20/03/2026 14:00:00`,
  'WEMA', NOW,
  { amount: 2500, type: 'debit', merchantContains: 'POS PURCHASE', balance: 27500, last4: '123', confidence: 'high' });

check('Wema Bank credit',
  `Acct: 987****123\nCR NGN15,000.00\nNarration: TRANSFER FROM UNCLE\nAvail Bal: NGN42,500.00\nDate: 21/03/2026 10:00:00`,
  'WemaBank', NOW,
  { amount: 15000, type: 'credit', merchantContains: 'UNCLE', balance: 42500, last4: '123', confidence: 'high' });

console.log('\n=== Stanbic IBTC ===\n');

check('Stanbic IBTC debit',
  `Acct: 741****852\nDebit Amt: NGN7,000.00\nDate: 02-APR-2026\nNarration: WEB TRANSFER\nAvail Bal: NGN33,000.00`,
  'STANBIC', NOW,
  { amount: 7000, type: 'debit', merchantContains: 'WEB TRANSFER', balance: 33000, last4: '852', confidence: 'high' });

check('Stanbic IBTC credit',
  `Acct: 741****852\nCredit Amt: NGN18,000.00\nDate: 03-APR-2026\nNarration: SALARY\nAvail Bal: NGN51,000.00`,
  'StanbicIBTC', NOW,
  { amount: 18000, type: 'credit', merchantContains: 'SALARY', balance: 51000, last4: '852', confidence: 'high' });

console.log('\n=== Ecobank ===\n');

check('Ecobank debit',
  `Acct: 951****753\nDebit: NGN4,800.00\nDate: 10-MAY-2026 11:30:00\nDesc: AIRTIME PURCHASE\nAvail Bal: NGN25,200.00`,
  'ECOBANK', NOW,
  { amount: 4800, type: 'debit', merchantContains: 'AIRTIME PURCHASE', balance: 25200, last4: '753', confidence: 'high' });

check('Ecobank credit',
  `Acct: 951****753\nCredit: NGN12,000.00\nDate: 11-MAY-2026 09:00:00\nDesc: TRANSFER FROM BROTHER\nAvail Bal: NGN37,200.00`,
  'EcobankNG', NOW,
  { amount: 12000, type: 'credit', merchantContains: 'BROTHER', balance: 37200, last4: '753', confidence: 'high' });

console.log('\n=== Polaris Bank ===\n');

check('Polaris Bank debit',
  `Acct: 357****159\nDR: NGN2,200.00\nDate: 14/06/2026\nDesc: POS DEBIT\nAvail Bal: NGN17,800.00`,
  'POLARIS', NOW,
  { amount: 2200, type: 'debit', merchantContains: 'POS DEBIT', balance: 17800, last4: '159', confidence: 'high' });

check('Polaris Bank credit',
  `Acct: 357****159\nCR: NGN9,000.00\nDate: 15/06/2026\nDesc: TRANSFER FROM SISTER\nAvail Bal: NGN26,800.00`,
  'PolarisBank', NOW,
  { amount: 9000, type: 'credit', merchantContains: 'SISTER', balance: 26800, last4: '159', confidence: 'high' });

console.log('\n=== Sterling Bank ===\n');

check('Sterling Bank debit',
  `Acct: 753****951\nAmt: NGN6,000.00 DR\nDesc: POS DEBIT\nAvail Bal: NGN44,000.00\nDate: 10-JAN-2026 13:00:00`,
  'STERLING', NOW,
  { amount: 6000, type: 'debit', merchantContains: 'POS DEBIT', balance: 44000, last4: '951', confidence: 'high' });

check('Sterling Bank credit',
  `Acct: 753****951\nAmt: NGN22,000.00 CR\nDesc: TRANSFER FROM NEPA\nAvail Bal: NGN66,000.00\nDate: 11-JAN-2026 10:00:00`,
  'SterlingBank', NOW,
  { amount: 22000, type: 'credit', merchantContains: 'NEPA', balance: 66000, last4: '951', confidence: 'high' });

console.log('\n=== Providus Bank ===\n');

check('Providus Bank credit',
  `Acct: 159****753\nNGN5,500.00 credited to your account\nDesc: TRANSFER FROM CLIENT\nAvail Bal: NGN30,500.00\nTime: 15-MAY-2026 14:30:00`,
  'PROVIDUS', NOW,
  { amount: 5500, type: 'credit', merchantContains: 'CLIENT', balance: 30500, last4: '753', confidence: 'high' });

console.log('\n=== Fintech Banks (Kuda, OPay, Moniepoint, PalmPay) ===\n');

check('Kuda debit',
  'You spent NGN3,200.00 on FoodCo. Merchant: FoodCo Ltd. Balance: NGN12,000.00 Time: 14:30',
  'KUDA', NOW,
  { amount: 3200, type: 'debit', merchantContains: 'FoodCo', balance: 12000, confidence: 'high' });

check('Kuda credit',
  'You received NGN8,000.00 from CHIOMA EZE. Merchant: CHIOMA EZE. Balance: NGN20,000.00 Time: 09:15',
  'Kuda', NOW,
  { amount: 8000, type: 'credit', merchantContains: 'CHIOMA EZE', balance: 20000, confidence: 'high' });

check('OPay debit',
  'Debit: NGN1,500.00 Sender: OPay User. Time: 12-MAR-2026 10:00:00',
  'OPay', NOW,
  { amount: 1500, type: 'debit', merchantContains: 'OPay User', confidence: 'medium' });

check('OPay credit',
  'Credit: NGN25,000.00 Sender: Business Client. Time: 13-MAR-2026 11:30:00',
  'OPAY', NOW,
  { amount: 25000, type: 'credit', merchantContains: 'Business Client', confidence: 'medium' });

check('Moniepoint debit',
  'NGN4,000.00 Transfer of successful. Sender: KEHINDE OLA. Recipient: ME. Available Balance: NGN16,000.00',
  'MONIEPOINT', NOW,
  { amount: 4000, type: 'debit', merchantContains: 'KEHINDE OLA', balance: 16000, confidence: 'high' });

check('Moniepoint credit',
  'NGN10,000.00 received successfully. Sender: AMAKA OBI. Available Balance: NGN26,000.00',
  'Moniepoint', NOW,
  { amount: 10000, type: 'credit', merchantContains: 'AMAKA OBI', balance: 26000, confidence: 'high' });

check('PalmPay debit',
  'NGN2,800.00 was spent on Grocery Store. From: Checking. Balance: NGN7,200.00',
  'PALMPAY', NOW,
  { amount: 2800, type: 'debit', merchantContains: 'Grocery Store', balance: 7200, confidence: 'high' });

check('PalmPay credit',
  'You received NGN5,000.00 from MUM. From: MUM. Balance: NGN12,200.00',
  'PalmPay', NOW,
  { amount: 5000, type: 'credit', merchantContains: 'MUM', balance: 12200, confidence: 'high' });

console.log('\n=== EDGE CASES ===\n');

check('Unknown sender with valid content',
  `Acct: ****5555\nAmt: NGN2,000.00 DR\nDesc: POS PURCHASE\nAvail Bal: NGN8,000.00\nDate: 2026-05-01 12:00:00`,
  'UNKNOWN BANK', NOW,
  { amount: 2000, type: 'debit', merchantContains: 'POS PURCHASE', balance: 8000, last4: '5555', confidence: 'high' });

check('No amount - should fail',
  'This is a test SMS without any amount',
  'GTBank', NOW,
  { expectNull: true });

check('No type - should fail',
  'Amt: NGN1,000.00 No type indicator here',
  'GTBank', NOW,
  { expectNull: true });

check('FirstBank single-line no balance',
  'Credit: 311XXXX999 Amt: NGN1,000.00 Date: 01-JAN-2026 10:00:00 Desc: ATM DEPOSIT',
  'FirstBank', NOW,
  { amount: 1000, type: 'credit', merchantContains: 'ATM DEPOSIT', confidence: 'medium' });

console.log(`\n\n${'='.repeat(50)}`);
console.log(`RESULTS: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
console.log(`${'='.repeat(50)}\n`);
