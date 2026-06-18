"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
const MONTH_MAP = {
    "Jan": "01", "Feb": "02", "Mar": "03", "Apr": "04",
    "May": "05", "Jun": "06", "Jul": "07", "Aug": "08",
    "Sep": "09", "Oct": "10", "Nov": "11", "Dec": "12",
    "JAN": "01", "FEB": "02", "MAR": "03", "APR": "04",
    "MAY": "05", "JUN": "06", "JUL": "07", "AUG": "08",
    "SEP": "09", "OCT": "10", "NOV": "11", "DEC": "12"
};
const SENDER_PATTERNS = {
    'GTBank': /gtbank|^gtb$/i,
    'Access Bank': /access\s*bank|^access$/i,
    'Zenith Bank': /zenith\s*bank|^zenith$|alertz/i,
    'FirstBank': /first\s*bank|^firstbank$|^fbn$/i,
    'UBA': /^uba(group)?$/i,
    'Kuda': /kuda/i,
    'OPay': /opay(-ng)?/i,
    'Moniepoint': /moniepoint/i,
    'PalmPay': /palmpay/i,
    'Fidelity Bank': /fidelity|fidelitybnk/i,
    'FCMB': /fcmb(ank)?/i,
    'Wema Bank': /wema/i,
    'Stanbic IBTC': /stanbic/i,
    'Ecobank': /ecobank(ng)?/i,
    'Polaris Bank': /polaris/i,
    'Sterling Bank': /sterling/i,
    'Providus Bank': /providus|providusbnk/i,
};
const AMOUNT_PATTERNS = {
    'GTBank': /(?:Amt|Amount):\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
    'Access Bank': /Amt:\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
    'Zenith Bank': /(?:CR|DR):\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
    'FirstBank': /(?:Credit|Debit):\s*(?:\d{3}X{4}\d{3}\s+)?\w+:\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
    'UBA': /(?:Credit|Debit)\s*Amt:\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
    'Kuda': /(?:spent|received)\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
    'OPay': /(?:Credit|Debit):\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
    'Moniepoint': /(?:NGN|₦)\s*([\d,]+\.\d{2}?)\s*(?:received|successful)/i,
    'PalmPay': /(?:received|spent\s+on)\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
    'Fidelity Bank': /(?:CR|DR):\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
    'FCMB': /(?:Debit|Credit):\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
    'Wema Bank': /(?:CR|DR)\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
    'Stanbic IBTC': /(?:Debit|Credit)\s*Amt:\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
    'Ecobank': /(?:Credit|Debit):\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
    'Polaris Bank': /(?:DR|CR):\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
    'Providus Bank': /(?:NGN|₦)\s*([\d,]+\.\d{2}?)\s*credited/i,
};
const CREDIT_PATTERNS = {
    'GTBank': /\bCR\b/,
    'Access Bank': /CREDIT ALERT/i,
    'Zenith Bank': /\bCR:\s*(?:NGN|₦)?/,
    'FirstBank': /\bCredit:\s*(?:\d{3}X{4}\d{3}\s+)?\w+:\s*(?:NGN|₦)?/i,
    'UBA': /Credit Amt:/i,
    'Kuda': /You received/i,
    'OPay': /Credit:\s*(?:NGN|₦)?/i,
    'Moniepoint': /received successfully/i,
    'PalmPay': /You received/i,
    'Fidelity Bank': /\bCR:\s*(?:NGN|₦)?/,
    'FCMB': /\bCredit:\s*(?:NGN|₦)?/,
    'Wema Bank': /\bCR\s+(?:NGN|₦)?/,
    'Stanbic IBTC': /Credit Amt:/i,
    'Ecobank': /Credit:\s*(?:NGN|₦)?/i,
    'Polaris Bank': /\bCR:\s*(?:NGN|₦)?/,
    'Providus Bank': /credited to your account/i,
    'default': /(?:credit|credited|received|deposit|inflow)/i,
};
const DEBIT_PATTERNS = {
    'GTBank': /\bDR\b/,
    'Access Bank': /DEBIT ALERT/i,
    'Zenith Bank': /\bDR:\s*(?:NGN|₦)?/,
    'FirstBank': /\bDebit:\s*(?:\d{3}X{4}\d{3}\s+)?\w+:\s*(?:NGN|₦)?/i,
    'UBA': /Debit Amt:/i,
    'Kuda': /You spent/i,
    'OPay': /Debit:\s*(?:NGN|₦)?/i,
    'Moniepoint': /(?:Transfer of|successful)/i,
    'PalmPay': /was spent on/i,
    'Fidelity Bank': /\bDR:\s*(?:NGN|₦)?/,
    'FCMB': /\bDebit:\s*(?:NGN|₦)?/,
    'Wema Bank': /\bDR\s+(?:NGN|₦)?/,
    'Stanbic IBTC': /Debit Amt:/i,
    'Ecobank': /Debit:\s*(?:NGN|₦)?/i,
    'Polaris Bank': /\bDR:\s*(?:NGN|₦)?/,
    'Providus Bank': /debited from your account/i,
    'default': /(?:debit|debited|spent|payment|withdrawal|purchase)/i,
};
const MERCHANT_PATTERNS = {
    'GTBank': /Desc:\s*(?:Transfer from\s+)?(.+?)(?:\n|$)/i,
    'Access Bank': /From:\s*(.+?)(?:\n|$)/i,
    'Zenith Bank': /Desc:\s*(.+?)(?:\n|$)/i,
    'FirstBank': /(?:Narration|Desc):\s*(.+?)(?=\s*(?:\.\s*(?:Avail(?:able)?\s*)?Bal|\n|$))/i,
    'UBA': /(?:From|Desc):\s*(.+?)(?=\s*(?:\.\s*(?:Avail(?:able)?\s*)?Bal|\n|$))/i,
    'Kuda': /(?:Merchant|From):\s*(.+?)(?=\s*(?:\.\s*(?:Avail(?:able)?\s*)?Bal|\n|$))/i,
    'OPay': /(?:Sender|Transaction):\s*(.+?)(?=\s*(?:\.\s*(?:Avail(?:able)?\s*)?Bal|\n|$))/i,
    'Moniepoint': /(?:Sender|Recipient):\s*(.+?)(?=\s*(?:\.\s*(?:Avail(?:able)?\s*)?Bal|\n|$))/i,
    'PalmPay': /From:\s*(.+?)(?=\s*(?:\.\s*(?:Avail(?:able)?\s*)?Bal|\n|$))/i,
    'Fidelity Bank': /Desc:\s*(.+?)(?=\s*(?:\.\s*(?:Avail(?:able)?\s*)?Bal|\n|$))/i,
    'FCMB': /Desc:\s*(.+?)(?=\s*(?:\.\s*(?:Avail(?:able)?\s*)?Bal|\n|$))/i,
    'Wema Bank': /Narration:\s*(.+?)(?=\s*(?:\.\s*(?:Avail(?:able)?\s*)?Bal|\n|$))/i,
    'Stanbic IBTC': /Narration:\s*(.+?)(?=\s*(?:\.\s*(?:Avail(?:able)?\s*)?Bal|\n|$))/i,
    'Ecobank': /Desc:\s*(.+?)(?=\s*(?:\.\s*(?:Avail(?:able)?\s*)?Bal|\n|$))/i,
    'Polaris Bank': /Desc:\s*(.+?)(?=\s*(?:\.\s*(?:Avail(?:able)?\s*)?Bal|\n|$))/i,
    'Sterling Bank': /Desc:\s*(.+?)(?=\s*(?:\.\s*(?:Avail(?:able)?\s*)?Bal|\n|$))/i,
    'Providus Bank': /Desc:\s*(.+?)(?=\s*(?:\.\s*(?:Avail(?:able)?\s*)?Bal|\n|$))/i,
    'default': /(?:Desc|Narration|From|Sender|Merchant|Beneficiary):\s*(.+?)(?=\s*(?:\.\s*(?:Avail(?:able)?\s*)?Bal|\n|$))/i,
};
const BALANCE_PATTERNS = {
    'default': /(?:Avail(?:able)?\s*)?Bal(?:ance)?:\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
    'Kuda': /Balance:\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
    'Moniepoint': /Available Balance:\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
};
const DATE_PATTERNS = {
    'GTBank': /Date:\s*(\d{2})-([A-Za-z]{3})-(\d{4})\s+(\d{1,2}):(\d{2})/i,
    'Access Bank': /Date:\s*(\d{2})\/(\d{2})\/(\d{4})/i,
    'Zenith Bank': /Date:\s*(\d{2})-([A-Z]{3})-(\d{4})\s+(\d{1,2}):(\d{2})/i,
    'FirstBank': /Date:\s*(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2}):(\d{2})/i,
    'UBA': /Date:\s*(\d{2})-([A-Za-z]{3})-(\d{4})\s+(\d{1,2}):(\d{2})/i,
    'Kuda': /Time:\s*(\d{1,2}):(\d{2})/i,
    'OPay': /Time:\s*(\d{1,2})-([A-Za-z]{3})-(\d{4})\s+(\d{1,2}):(\d{2})/i,
    'Moniepoint': /(\d{2})-([A-Za-z]{3})-(\d{4})\s+(\d{1,2}):(\d{2})/i,
    'PalmPay': /Time:\s*(\d{1,2}):(\d{2})/i,
    'Fidelity Bank': /Date:\s*(\d{2})\/(\d{2})\/(\d{4})/i,
    'FCMB': /Date:\s*(\d{2})-([A-Za-z]{3})-(\d{4})/i,
    'Wema Bank': /(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2}):(\d{2})/i,
    'Stanbic IBTC': /Date:\s*(\d{2})-([A-Za-z]{3})-(\d{4})/i,
    'Ecobank': /(\d{2})-([A-Za-z]{3})-(\d{4})\s+(\d{1,2}):(\d{2})/i,
    'Polaris Bank': /Date:\s*(\d{2})\/(\d{2})\/(\d{4})/i,
    'Providus Bank': /Time:\s*(\d{1,2})-([A-Za-z]{3})-(\d{4})\s+(\d{1,2}):(\d{2})/i,
};
const GENERIC_DATE_PATTERNS = [
    { pattern: /Date:\s*(\d{2})-([A-Za-z]{3})-(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(?:AM|PM)?/i, isMonthName: true },
    { pattern: /Date:\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(?:AM|PM)?/i, isMonthName: false },
    { pattern: /Date:\s*(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(?:AM|PM)?/i, isMonthName: false },
    { pattern: /(\d{2})-([A-Za-z]{3})-(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(?:AM|PM)?/i, isMonthName: true },
    { pattern: /(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(?:AM|PM)?/i, isMonthName: false },
    { pattern: /Date:\s*(\d{2})-([A-Za-z]{3})-(\d{4})/i, isMonthName: true },
    { pattern: /Date:\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/i, isMonthName: false },
    { pattern: /Date:\s*(\d{4})-(\d{2})-(\d{2})/i, isMonthName: false },
    { pattern: /Time:\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(?:AM|PM)?/i, isMonthName: false },
];
function parseNGN(value) {
    return parseFloat(value.replace(/,/g, ''));
}
function safeMatch(pattern, body) {
    pattern.lastIndex = 0;
    return body.match(pattern);
}
const GENERIC_AMOUNT_PATTERNS = [
    /(?:Amt|Amount):\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
    /(?:Credit|Debit):\s*(?:\d{3}X{4}\d{3}\s+)?\w+:\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
    /(?:Credit|Debit):\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
    /(?:CR|DR):\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
    /(?:CR|DR)\s+(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
    /(?:spent|received)\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
    /(?:NGN|₦)\s*([\d,]+\.\d{2}?)\s*(?:received|successful)/i,
    /(?:received|spent\s+on)\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
    /(?:NGN|₦)\s*([\d,]+\.\d{2}?)\s*credited/i,
    /(?:NGN|₦)\s*([\d,]+\.\d{2})/i,
];
const GENERIC_TYPE_PATTERNS = {
    credit: [
        /\bCR\b(?!\s*EDIT)/i,
        /Credit:\s*(?:\d{3}X{4}\d{3}\s+)?\w+:\s*(?:NGN|₦)?/i,
        /Credit\s+Amt:/i,
        /CREDIT ALERT/i,
        /You received/i,
        /received successfully/i,
        /credited to your account/i,
        /(?:^|\s)Credit(?:\s|:)/i,
        /(?:credit|credited|received|deposit|inflow)/i,
    ],
    debit: [
        /\bDR\b(?!\s*AW)/i,
        /Debit:\s*(?:\d{3}X{4}\d{3}\s+)?\w+:\s*(?:NGN|₦)?/i,
        /Debit\s+Amt:/i,
        /DEBIT ALERT/i,
        /You spent/i,
        /was spent on/i,
        /debited from your account/i,
        /(?:^|\s)Debit(?:\s|:)/i,
        /(?:debit|debited|spent|payment|withdrawal|purchase)/i,
    ],
};
const GENERIC_MERCHANT_PATTERNS = [
    /(?:Desc|Narration|From|Sender|Merchant|Beneficiary):\s*(.+?)(?=\s*(?:\.\s*(?:Avail(?:able)?\s*)?Bal|\n|$))/i,
    /(?:Desc|Narration|From|Sender|Merchant|Beneficiary):\s*(.+?)(?:\n|$)/i,
];
const GENERIC_BALANCE_PATTERNS = [
    /(?:Avail(?:able)?\s*)?Bal(?:ance)?:\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
    /Available Balance:\s*(?:NGN|₦)?\s*([\d,]+\.\d{2})/i,
];
const GENERIC_ACCOUNT_PATTERNS = [
    { pattern: /Acct:\s*\*{4}(\d{4})/i, extractLast4: (m) => m[1] },
    { pattern: /Acct:\s*(\d{3})\*{4}(\d{3})/i, extractLast4: (m) => m[2] },
    { pattern: /Acct:\s*(\d{10})/i, extractLast4: (m) => m[1].slice(-4) },
    { pattern: /(?:Credit|Debit):\s*(\d{3})X{4}(\d{3})/i, extractLast4: (m) => m[2] },
    { pattern: /(?:\d{3})\*{4}(\d{3})/i, extractLast4: (m) => m[1] },
    { pattern: /(?:\d{3})X{4}(\d{3})/i, extractLast4: (m) => m[1] },
];
function tryGenericDate(body) {
    for (const { pattern, isMonthName } of GENERIC_DATE_PATTERNS) {
        const match = safeMatch(pattern, body);
        if (!match)
            continue;
        if (isMonthName && match[2] && MONTH_MAP[match[2]]) {
            const m = match;
            const day = m[1].padStart(2, '0');
            const month = MONTH_MAP[m[2]];
            const year = m[3];
            const hour = m[4] ? m[4].padStart(2, '0') : '00';
            const min = m[5] ? m[5].padStart(2, '0') : '00';
            const parsed = new Date(`${year}-${month}-${day}T${hour}:${min}:00`).getTime();
            if (!isNaN(parsed))
                return parsed;
        }
        if (!isMonthName && match[2] && match[3]) {
            const groups = match;
            const year = groups[3].length === 4 ? groups[3] : groups[1];
            const month = groups[3].length === 4 ? groups[2] : groups[1];
            const day = groups[3].length === 4 ? groups[1] : groups[2];
            const hour = groups[4] ? groups[4].padStart(2, '0') : '00';
            const min = groups[5] ? groups[5].padStart(2, '0') : '00';
            const y = year.length === 4 ? year : `20${groups[3]}`;
            const m = month.padStart(2, '0');
            const d = day.padStart(2, '0');
            const parsed = new Date(`${y}-${m}-${d}T${hour}:${min}:00`).getTime();
            if (!isNaN(parsed))
                return parsed;
        }
    }
    return null;
}
function tryGenericAmount(body) {
    for (const p of GENERIC_AMOUNT_PATTERNS) {
        const match = safeMatch(p, body);
        if (match)
            return parseNGN(match[1]);
    }
    return null;
}
function tryGenericType(body) {
    let isDebit = false;
    let isCredit = false;
    for (const p of GENERIC_TYPE_PATTERNS.debit) {
        if (safeMatch(p, body)) {
            isDebit = true;
            break;
        }
    }
    for (const p of GENERIC_TYPE_PATTERNS.credit) {
        if (safeMatch(p, body)) {
            isCredit = true;
            break;
        }
    }
    if (isDebit && !isCredit)
        return 'debit';
    if (isCredit && !isDebit)
        return 'credit';
    if (isDebit && isCredit) {
        const lower = body.toLowerCase();
        if (lower.includes('spent') || lower.includes('payment'))
            return 'debit';
        if (lower.includes('received') || lower.includes('credited'))
            return 'credit';
    }
    return null;
}
function tryGenericMerchant(body) {
    for (const p of GENERIC_MERCHANT_PATTERNS) {
        const match = safeMatch(p, body);
        if (match) {
            return match[1]
                .replace(/^(?:Transfer from|Transfer to|From|To)\s+/i, '')
                .replace(/\s+/g, ' ')
                .trim();
        }
    }
    return null;
}
function tryGenericBalance(body) {
    for (const p of GENERIC_BALANCE_PATTERNS) {
        const match = safeMatch(p, body);
        if (match)
            return parseNGN(match[1]);
    }
    return null;
}
function tryGenericAccountInfo(body) {
    for (const { pattern, extractLast4 } of GENERIC_ACCOUNT_PATTERNS) {
        const match = safeMatch(pattern, body);
        if (match) {
            const last4 = extractLast4(match);
            if (last4)
                return { last4 };
        }
    }
    return { last4: null };
}
class Parser {
    static parseSMS(body, sender, timestamp, debug) {
        const bank = this.identifyBank(sender);
        if (debug)
            console.log(`[Parser] Bank identified: ${bank || 'null'} from sender: ${sender}`);
        let results = {};
        if (bank) {
            results = this.extractSMSWithBank(body, bank, debug);
        }
        else {
            if (debug)
                console.log('[Parser] No bank match, using generic fallback');
        }
        if (!results.amount && !results.type) {
            if (debug)
                console.log('[Parser] Bank-specific extraction failed or missing. Trying generic fallback...');
            const genericAmount = tryGenericAmount(body);
            if (genericAmount !== null)
                results.amount = genericAmount;
            if (!results.type)
                results.type = tryGenericType(body);
        }
        if (!results.merchant) {
            const genericMerchant = tryGenericMerchant(body);
            if (genericMerchant)
                results.merchant = genericMerchant;
        }
        if (results.balance === null || results.balance === undefined) {
            const genericBalance = tryGenericBalance(body);
            if (genericBalance !== null)
                results.balance = genericBalance;
        }
        if (!results.last4) {
            const genericAccount = tryGenericAccountInfo(body);
            results.last4 = genericAccount.last4;
        }
        if (!results.transactionDate) {
            const genericDate = tryGenericDate(body);
            if (genericDate !== null) {
                results.transactionDate = genericDate;
                if (debug)
                    console.log('[Parser] Date recovered via generic patterns');
            }
        }
        const date = results.transactionDate || timestamp;
        const confidence = (results.merchant || results.type) && results.balance !== null ? 'high'
            : (results.merchant || results.type) ? 'medium'
                : 'low';
        if (results.amount === null || results.amount === undefined) {
            if (debug)
                console.log('[Parser] Failed: no amount extracted');
            return null;
        }
        if (!results.type) {
            if (debug)
                console.log('[Parser] Failed: no transaction type extracted');
            return null;
        }
        if (debug)
            console.log('[Parser] Final result:', {
                amount: results.amount,
                type: results.type,
                merchant: results.merchant,
                date: new Date(date).toISOString(),
                balance: results.balance,
                last4: results.last4,
                confidence,
            });
        return {
            amount: results.amount,
            currency: 'NGN',
            transactionType: results.type,
            merchantName: results.merchant || null,
            accountName: results.accountName || bank || 'Unknown',
            accountNumberLast4: results.last4 || null,
            transactionDate: date,
            availableBalance: results.balance !== null && results.balance !== undefined ? results.balance : null,
            sourceChannel: 'sms',
            parseConfidence: confidence,
            rawSourceText: body,
        };
    }
    static extractSMSWithBank(body, bank, debug) {
        const amount = this.extractAmount(body, bank, debug);
        const type = this.extractType(body, bank, debug);
        const date = this.extractDate(body, bank, debug);
        const merchant = this.extractMerchant(body, bank, debug);
        const balance = this.extractBalance(body, bank, debug);
        const { last4 } = this.extractAccountInfo(body, bank);
        return { amount, type, transactionDate: date, merchant, balance, last4, accountName: bank };
    }
    static parseEmail(body, fromAddress, timestamp) {
        const emailSenders = {
            'alerts@gtbank.com': 'GTBank',
            'alerts@accessbankplc.com': 'Access Bank',
            'alert@firstbanknigeria.com': 'FirstBank',
            'alert@zenithbank.com': 'Zenith Bank',
            'alerts@ubagroup.com': 'UBA',
            'notifications@kuda.co': 'Kuda',
            'alerts@opay.africa': 'OPay',
            'hello@grey.co': 'Grey',
            'notifications@geegpay.com': 'Geegpay',
            'transfers@lemfi.com': 'Lemfi',
        };
        const bank = Object.entries(emailSenders).find(([addr]) => fromAddress.toLowerCase().includes(addr.toLowerCase()))?.[1];
        if (!bank)
            return null;
        const amount = this.extractAmount(body, bank) ?? this.extractEmailAmount(body);
        if (amount === null)
            return null;
        const currency = this.extractCurrency(body);
        const type = this.extractType(body, bank) ?? this.extractEmailType(body);
        const date = this.extractDate(body, bank) || this.extractEmailDate(body) || timestamp;
        const merchant = this.extractMerchant(body, bank) || this.extractEmailMerchant(body);
        const balance = this.extractBalance(body, bank);
        const { accountName, last4 } = this.extractAccountInfo(body, bank);
        const confidence = merchant && balance ? 'high'
            : merchant || balance ? 'medium'
                : 'low';
        return {
            amount,
            currency,
            transactionType: type || 'debit',
            merchantName: merchant,
            accountName: accountName || bank,
            accountNumberLast4: last4,
            transactionDate: date,
            availableBalance: balance,
            sourceChannel: 'email',
            parseConfidence: confidence,
            rawSourceText: body,
        };
    }
    static identifyBank(sender) {
        for (const [bank, pattern] of Object.entries(SENDER_PATTERNS)) {
            if (pattern.test(sender.trim()))
                return bank;
        }
        return null;
    }
    static extractAmount(body, bank, debug) {
        const pattern = AMOUNT_PATTERNS[bank];
        if (pattern) {
            const match = safeMatch(pattern, body);
            if (match) {
                if (debug)
                    console.log(`[Parser/${bank}] Amount matched bank pattern: ${match[1]}`);
                return parseNGN(match[1]);
            }
        }
        const genericAmount = tryGenericAmount(body);
        if (genericAmount !== null) {
            if (debug)
                console.log(`[Parser/${bank}] Amount matched generic fallback: ${genericAmount}`);
        }
        return genericAmount;
    }
    static extractType(body, bank, debug) {
        const debitPattern = DEBIT_PATTERNS[bank] || DEBIT_PATTERNS.default;
        const creditPattern = CREDIT_PATTERNS[bank] || CREDIT_PATTERNS.default;
        const isDebit = safeMatch(debitPattern, body) !== null;
        const isCredit = safeMatch(creditPattern, body) !== null;
        if (debug)
            console.log(`[Parser/${bank}] Type: isDebit=${isDebit}, isCredit=${isCredit}`);
        if (isDebit && !isCredit)
            return 'debit';
        if (isCredit && !isDebit)
            return 'credit';
        if (isDebit && isCredit) {
            const lower = body.toLowerCase();
            if (lower.includes('spent') || lower.includes('payment'))
                return 'debit';
            if (lower.includes('received') || lower.includes('credited'))
                return 'credit';
        }
        const genericType = tryGenericType(body);
        if (genericType && debug)
            console.log(`[Parser/${bank}] Type recovered via generic fallback: ${genericType}`);
        return genericType;
    }
    static extractDate(body, bank, debug) {
        const pattern = DATE_PATTERNS[bank];
        if (pattern) {
            const match = safeMatch(pattern, body);
            if (match) {
                if (bank === 'Kuda' || bank === 'PalmPay') {
                    return Date.now();
                }
                if (match[2] && MONTH_MAP[match[2]]) {
                    const day = match[1].padStart(2, '0');
                    const month = MONTH_MAP[match[2]];
                    const year = match[3];
                    const hour = match[4] ? match[4].padStart(2, '0') : '00';
                    const min = match[5] ? match[5].padStart(2, '0') : '00';
                    const parsed = new Date(`${year}-${month}-${day}T${hour}:${min}:00`).getTime();
                    if (!isNaN(parsed)) {
                        if (debug)
                            console.log(`[Parser/${bank}] Date matched bank pattern: ${year}-${month}-${day}T${hour}:${min}`);
                        return parsed;
                    }
                }
                if (match[2] && match[3]) {
                    const day = match[1].padStart(2, '0');
                    const month = match[2].padStart(2, '0');
                    const year = match[3];
                    const parsed = new Date(`${year}-${month}-${day}`).getTime();
                    if (!isNaN(parsed)) {
                        if (debug)
                            console.log(`[Parser/${bank}] Date matched bank pattern (numeric): ${year}-${month}-${day}`);
                        return parsed;
                    }
                }
            }
        }
        const genericDate = tryGenericDate(body);
        if (genericDate !== null && debug)
            console.log(`[Parser/${bank}] Date recovered via generic patterns`);
        return genericDate;
    }
    static extractMerchant(body, bank, debug) {
        const pattern = MERCHANT_PATTERNS[bank] || MERCHANT_PATTERNS.default;
        const match = safeMatch(pattern, body);
        if (match) {
            const merchant = match[1]
                .replace(/^(?:Transfer from|Transfer to|From|To)\s+/i, '')
                .replace(/\s+/g, ' ')
                .trim();
            if (merchant) {
                if (debug)
                    console.log(`[Parser/${bank}] Merchant matched: ${merchant}`);
                return merchant;
            }
        }
        const genericMerchant = tryGenericMerchant(body);
        if (genericMerchant && debug)
            console.log(`[Parser/${bank}] Merchant recovered via generic: ${genericMerchant}`);
        return genericMerchant;
    }
    static extractBalance(body, bank, debug) {
        const pattern = BALANCE_PATTERNS[bank] || BALANCE_PATTERNS.default;
        const match = safeMatch(pattern, body);
        if (match) {
            if (debug)
                console.log(`[Parser/${bank}] Balance matched: ${match[1]}`);
            return parseNGN(match[1]);
        }
        const genericBalance = tryGenericBalance(body);
        if (genericBalance !== null && debug)
            console.log(`[Parser/${bank}] Balance recovered via generic: ${genericBalance}`);
        return genericBalance;
    }
    static extractAccountInfo(body, bank) {
        const genericResult = tryGenericAccountInfo(body);
        if (genericResult.last4) {
            return { accountName: bank, last4: genericResult.last4 };
        }
        const match = safeMatch(/Acct:\s*(\d{3}\*{4}\d{3}|\d{10})/i, body);
        if (match) {
            const full = match[1];
            const last4 = full.slice(-4);
            return { accountName: bank, last4 };
        }
        return { accountName: bank, last4: null };
    }
    static extractEmailAmount(body) {
        const match = safeMatch(/(?:NGN|₦|\$|£|USD|GBP)\s*([\d,]+\.\d{2})/i, body);
        return match ? parseNGN(match[1]) : null;
    }
    static extractCurrency(body) {
        if (/£|GBP/i.test(body))
            return 'GBP';
        if (/\$|USD/i.test(body))
            return 'USD';
        return 'NGN';
    }
    static extractEmailType(body) {
        const lower = body.toLowerCase();
        if (lower.includes('debit') || lower.includes('spent') || lower.includes('payment'))
            return 'debit';
        return 'credit';
    }
    static extractEmailMerchant(body) {
        const match = safeMatch(/(?:Dear|Hi|Hello)\s+(\w+)/i, body);
        return match ? match[1] : null;
    }
    static extractEmailDate(body) {
        const match = safeMatch(/(?:\bDate\b|\bTime\b):\s*([^\n\r]+)/i, body);
        if (match) {
            const parsed = Date.parse(match[1].trim());
            if (!isNaN(parsed))
                return parsed;
        }
        return null;
    }
}
exports.Parser = Parser;
