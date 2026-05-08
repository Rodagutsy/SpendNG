SpendNG SMS Regex Library
Overview
This skill defines regex patterns, sender identifiers, and extraction rules for parsing transaction alerts from Nigerian banks and fintechs. Use this when implementing the transaction parser as defined in PRD Section 6.3.
Supported Institutions (Version 1)
Traditional Banks

GTBank
Access Bank
Zenith Bank
FirstBank
UBA
Fidelity Bank
FCMB
Wema Bank
Stanbic IBTC Bank
Ecobank Nigeria
Polaris Bank
Providus Bank

Fintech Platforms

Kuda
OPay
Moniepoint
PalmPay

Sender Identifiers
GTBank

Sender ID: GTBank, GTBANK, GTB
Pattern: ^GT[Bb]ank|^GTB$|^GTBANK$

Access Bank

Sender ID: AccessBank, ACCESS, ACCESSBANK
Pattern: ^Access[Bb]ank|^ACCESS(BANK)?$

Zenith Bank

Sender ID: ZenithBank, ZENITH, AlertZ
Pattern: ^Zenith[Bb]ank|^ZENITH$|^AlertZ$

FirstBank

Sender ID: FirstBank, FIRSTBANK, FBN
Pattern: ^First[Bb]ank|^FIRSTBANK$|^FBN$

UBA

Sender ID: UBA, UBAGroup
Pattern: ^UBA(Group)?$

Kuda

Sender ID: Kuda, KUDA
Pattern: ^Kuda$|^KUDA$

OPay

Sender ID: OPay, OPAY, OPay-NG
Pattern: ^OPay(-NG)?$|^OPAY$

Moniepoint

Sender ID: Moniepoint, MONIEPOINT
Pattern: ^Moniepoint$|^MONIEPOINT$

PalmPay

Sender ID: PalmPay, PALMPAY
Pattern: ^PalmPay$|^PALMPAY$

Fidelity Bank

Sender ID: Fidelity, FIDELITY, FidelityBnk
Pattern: ^Fidelity(Bnk)?$|^FIDELITY$

FCMB

Sender ID: FCMB, FCMBank
Pattern: ^FCMB(ank)?$

Wema Bank

Sender ID: Wema, WEMA, WemaBank
Pattern: ^Wema([Bb]ank)?$|^WEMA$

Stanbic IBTC

Sender ID: StanbicIBTC, STANBIC, Stanbic
Pattern: ^Stanbic(IBTC)?$|^STANBIC$

Ecobank

Sender ID: Ecobank, ECOBANK, EcobankNG
Pattern: ^Ecobank(NG)?$|^ECOBANK$

Polaris Bank

Sender ID: Polaris, POLARIS, PolarisBank
Pattern: ^Polaris([Bb]ank)?$|^POLARIS$

Providus Bank

Sender ID: Providus, PROVIDUS, ProvidusBnk
Pattern: ^Providus(Bnk)?$|^PROVIDUS$

Amount Extraction Patterns
Universal Amount Pattern
regex(?:NGN|₦)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)
Captures: 15,000.00, 2,500.00, NGN50,000.00, ₦3,200.00

GTBank Amount Pattern
regex(?:Amt|Amount):\s*NGN\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:CR|DR)
Example: Amt: NGN15,000.00 CR → Captures 15,000.00

Access Bank Amount Pattern
regexAmt:\s*NGN\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)
Example: Amt: NGN50,000.00 → Captures 50,000.00

Zenith Bank Amount Pattern
regex(?:CR|DR):\s*NGN\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)
Example: CR: NGN75,000.00 → Captures 75,000.00

FirstBank Amount Pattern
regex(?:Credit|Debit):\s*NGN\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)
Example: Credit: NGN20,000.00 → Captures 20,000.00

UBA Amount Pattern
regex(?:Credit|Debit)\s*Amt:\s*NGN\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)
Example: Credit Amt: NGN100,000.00 → Captures 100,000.00

Kuda Amount Pattern
regex(?:spent|received)\s*NGN\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)
Example: You spent NGN2,800.00 → Captures 2,800.00

OPay Amount Pattern
regex(?:Credit|Debit):\s*NGN\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)
Example: Credit: NGN8,500.00 → Captures 8,500.00

Moniepoint Amount Pattern
regexNGN\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:received|successful)
Example: NGN45,000.00 received successfully → Captures 45,000.00

PalmPay Amount Pattern
regex(?:received|spent\s+on)\s*NGN\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)
Example: You received NGN5,000.00 → Captures 5,000.00

Fidelity Bank Amount Pattern
regex(?:CR|DR):\s*NGN\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)
Example: CR: NGN15,000.00 → Captures 15,000.00

FCMB Amount Pattern
regex(?:Debit|Credit):\s*NGN\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)
Example: Debit: NGN4,000.00 → Captures 4,000.00

Wema Bank Amount Pattern
regex(?:CR|DR)\s*NGN\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)
Example: CR NGN25,000.00 → Captures 25,000.00

Stanbic IBTC Amount Pattern
regex(?:Debit|Credit)\s*Amt:\s*NGN\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)
Example: Debit Amt: NGN9,500.00 → Captures 9,500.00

Ecobank Amount Pattern
regex(?:Credit|Debit):\s*NGN\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)
Example: Credit: NGN80,000.00 → Captures 80,000.00

Polaris Bank Amount Pattern
regex(?:DR|CR):\s*NGN\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)
Example: DR: NGN2,300.00 → Captures 2,300.00

Providus Bank Amount Pattern
regexNGN\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*credited
Example: NGN120,000.00 credited → Captures 120,000.00

Currency Detection
NGN Pattern
regex(?:NGN|₦|Naira)
Multi-Currency Pattern (for international platforms)
regex(NGN|USD|GBP|EUR)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)

Note: Version 1 primarily handles NGN. USD/GBP appear in email alerts from Grey, Geegpay, Lemfi (covered separately in email parsing).
Date/Time Extraction Patterns

GTBank Date Pattern
regexDate:\s*(\d{2})-([A-Za-z]{3})-(\d{4})\s+(\d{2}):(\d{2})
Format: DD-Mon-YYYY HH:MM
Example: Date: 07-May-2026 14:32
Captures: Day=07, Month=May, Year=2026, Hour=14, Minute=32

Access Bank Date Pattern
regexDate:\s*(\d{2})/(\d{2})/(\d{4})
Format: DD/MM/YYYY
Example: Date: 07/05/2026
Captures: Day=07, Month=05, Year=2026

Zenith Bank Date Pattern
regexDate:\s*(\d{2})-([A-Z]{3})-(\d{4})\s+(\d{2}):(\d{2})
Format: DD-MON-YYYY HH:MM
Example: Date: 07-MAY-2026 08:15
Captures: Day=07, Month=MAY, Year=2026, Hour=08, Minute=15

FirstBank Date Pattern
regexDate:\s*(\d{2})/(\d{2})/(\d{4})\s+(\d{2}):(\d{2})
Format: DD/MM/YYYY HH:MM
Example: Date: 07/05/2026 10:05
Captures: Day=07, Month=05, Year=2026, Hour=10, Minute=05

UBA Date Pattern
regexDate:\s*(\d{2})-([A-Za-z]{3})-(\d{4})\s+(\d{2}):(\d{2})
Format: DD-Mon-YYYY HH:MM
Example: Date: 07-May-2026 16:20
Captures: Day=07, Month=May, Year=2026, Hour=16, Minute=20

Kuda Date Pattern
regexTime:\s*(\d{2}):(\d{2})
Format: HH:MM (date inferred from SMS timestamp)
Example: Time: 15:04
Captures: Hour=15, Minute=04

OPay Date Pattern
regexTime:\s*(\d{2})-([A-Za-z]{3})-(\d{4})\s+(\d{2}):(\d{2})
Format: DD-Mon-YYYY HH:MM
Example: Time: 07-May-2026 13:10
Captures: Day=07, Month=May, Year=2026, Hour=13, Minute=10

Moniepoint Date Pattern
regex(\d{2})-([A-Za-z]{3})-(\d{4})\s+(\d{2}):(\d{2})
Format: DD-Mon-YYYY HH:MM
Example: 07-May-2026 09:30
Captures: Day=07, Month=May, Year=2026, Hour=09, Minute=30

PalmPay Date Pattern
regexTime:\s*(\d{2}):(\d{2})
Format: HH:MM (date inferred from SMS timestamp)
Example: Time: 14:09
Captures: Hour=14, Minute=09

Fidelity Bank Date Pattern
regexDate:\s*(\d{2})/(\d{2})/(\d{4})
Format: DD/MM/YYYY
Example: Date: 07/05/2026
Captures: Day=07, Month=05, Year=2026

FCMB Date Pattern
regexDate:\s*(\d{2})-([A-Za-z]{3})-(\d{4})
Format: DD-Mon-YYYY
Example: Date: 07-May-2026
Captures: Day=07, Month=May, Year=2026

Wema Bank Date Pattern
regex(\d{2})/(\d{2})/(\d{4})\s+(\d{2}):(\d{2})
Format: DD/MM/YYYY HH:MM
Example: 07/05/2026 18:22
Captures: Day=07, Month=05, Year=2026, Hour=18, Minute=22

Stanbic IBTC Date Pattern
regexDate:\s*(\d{2})-([A-Za-z]{3})-(\d{4})
Format: DD-Mon-YYYY
Example: Date: 07-May-2026
Captures: Day=07, Month=May, Year=2026

Ecobank Date Pattern
regex(\d{2})-([A-Za-z]{3})-(\d{4})\s+(\d{2}):(\d{2})
Format: DD-Mon-YYYY HH:MM
Example: 07-May-2026 11:41
Captures: Day=07, Month=May, Year=2026, Hour=11, Minute=41

Polaris Bank Date Pattern
regexDate:\s*(\d{2})/(\d{2})/(\d{4})
Format: DD/MM/YYYY
Example: Date: 07/05/2026
Captures: Day=07, Month=05, Year=2026

Providus Bank Date Pattern
regexTime:\s*(\d{2})-([A-Za-z]{3})-(\d{4})\s+(\d{2}):(\d{2})
Format: DD-Mon-YYYY HH:MM
Example: Time: 07-May-2026 17:15
Captures: Day=07, Month=May, Year=2026, Hour=17, Minute=15

Month Name Mapping
javascript{
  "Jan": "01", "Feb": "02", "Mar": "03", "Apr": "04",
  "May": "05", "Jun": "06", "Jul": "07", "Aug": "08",
  "Sep": "09", "Oct": "10", "Nov": "11", "Dec": "12",
  "JAN": "01", "FEB": "02", "MAR": "03", "APR": "04",
  "MAY": "05", "JUN": "06", "JUL": "07", "AUG": "08",
  "SEP": "09", "OCT": "10", "NOV": "11", "DEC": "12"
}
Debit/Credit Detection
GTBank

Credit Pattern: \bCR\b
Debit Pattern: \bDR\b

Access Bank

Credit Pattern: CREDIT ALERT
Debit Pattern: DEBIT ALERT

Zenith Bank

Credit Pattern: \bCR:\s*NGN
Debit Pattern: \bDR:\s*NGN

FirstBank

Credit Pattern: \bCredit:\s*NGN
Debit Pattern: \bDebit:\s*NGN

UBA

Credit Pattern: Credit Amt:
Debit Pattern: Debit Amt:

Kuda

Credit Pattern: You received
Debit Pattern: You spent

OPay

Credit Pattern: Credit:\s*NGN
Debit Pattern: Debit:\s*NGN

Moniepoint

Credit Pattern: received successfully
Debit Pattern: (?:Transfer of|successful)

PalmPay

Credit Pattern: You received
Debit Pattern: was spent on

Fidelity Bank

Credit Pattern: \bCR:\s*NGN
Debit Pattern: \bDR:\s*NGN

FCMB

Credit Pattern: \bCredit:\s*NGN
Debit Pattern: \bDebit:\s*NGN

Wema Bank

Credit Pattern: \bCR\s+NGN
Debit Pattern: \bDR\s+NGN

Stanbic IBTC

Credit Pattern: Credit Amt:
Debit Pattern: Debit Amt:

Ecobank

Credit Pattern: Credit:\s*NGN
Debit Pattern: Debit:\s*NGN

Polaris Bank

Credit Pattern: \bCR:\s*NGN
Debit Pattern: \bDR:\s*NGN

Providus Bank

Credit Pattern: credited to your account
Debit Pattern: debited from your account

Account Number Extraction
Full Account Pattern (for banks showing full numbers)
regexAcct(?:ount)?:\s*(\d{10})
Example: Acct: 0123456789 → Captures 0123456789
Masked Account Pattern (for banks showing last 4 digits)
regexAcct(?:ount)?:\s*(\d{3}\*{4}\d{3})
Example: Acct: 044****221 → Captures 044****221
Last 4 Digits Extraction
regex\*{4}(\d{3,4})
Example: 044****221 → Captures 221
Merchant/Sender Extraction

GTBank
regexDesc:\s*(?:Transfer from\s+)?(.+?)(?:\n|$)
Example: Desc: Transfer from JOHN DOE → Captures JOHN DOE

Access Bank
regexFrom:\s*(.+?)(?:\n|$)
Example: From: MARY OKAFOR → Captures MARY OKAFOR

Zenith Bank
regexDesc:\s*(.+?)(?:\n|$)
Example: Desc: Salary Payment → Captures Salary Payment

FirstBank
regexNarration:\s*(.+?)(?:\n|$)
Example: Narration: Transfer from Musa → Captures Transfer from Musa

UBA
regex(?:From|Desc):\s*(.+?)(?:\n|$)
Example: From: ADEBAYO → Captures ADEBAYO

Kuda
regex(?:Merchant|From):\s*(.+?)(?:\n|$)
Example: Merchant: SHOPRITE → Captures SHOPRITE

OPay
regex(?:Sender|Transaction):\s*(.+?)(?:\n|$)
Example: Sender: Chinedu → Captures Chinedu

Moniepoint
regex(?:Sender|Recipient):\s*(.+?)(?:\n|$)
Example: Sender: AJIBOLA → Captures AJIBOLA

PalmPay
regexFrom:\s*(.+?)(?:\n|$)
Example: From: Yusuf A. → Captures Yusuf A.

Fidelity Bank
regexDesc:\s*(.+?)(?:\n|$)
Example: Desc: Transfer → Captures Transfer

FCMB
regexNarration:\s*(.+?)(?:\n|$)
Example: Narration: POS Purchase → Captures POS Purchase

Wema Bank
regexFrom:\s*(.+?)(?:\n|$)
Example: From: Samuel → Captures Samuel

Stanbic IBTC
regexNarration:\s*(.+?)(?:\n|$)
Example: Narration: Transfer → Captures Transfer

Ecobank
regexSender:\s*(.+?)(?:\n|$)
Example: Sender: Bright U. → Captures Bright U.

Polaris Bank
regexDesc:\s*(.+?)(?:\n|$)
Example: Desc: Transfer to PalmPay → Captures Transfer to PalmPay

Providus Bank
regexSender:\s*(.+?)(?:\n|$)
Example: Sender: JIDE ENTERPRISE → Captures JIDE ENTERPRISE

Balance Extraction
Universal Balance Pattern
regex(?:Avail(?:able)?\s*)?Bal(?:ance)?:\s*NGN\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)
Example: Avail Bal: NGN85,450.22 → Captures 85,450.22

Kuda/PalmPay Balance Pattern
regexBalance:\s*NGN\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)
Example: Balance: NGN18,420.50 → Captures 18,420.50

Moniepoint Balance Pattern
regexAvailable Balance:\s*NGN\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)
Example: Available Balance: NGN91,000.22 → Captures 91,000.22

Complete Template Structures

GTBank Template
regex^.*Acct:\s*(\d{10})\s*Amt:\s*NGN\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(CR|DR)\s*Desc:\s*(.+?)\s*Avail Bal:\s*NGN\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*Date:\s*(\d{2})-([A-Za-z]{3})-(\d{4})\s+(\d{2}):(\d{2}).*$

Access Bank Template
regex^.*(CREDIT|DEBIT)\s*ALERT.*Amt:\s*NGN\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?).*Acct:\s*(\d{3}\*{4}\d{3}).*(?:From|Desc):\s*(.+?)\s*Date:\s*(\d{2})/(\d{2})/(\d{4}).*Avail Bal:\s*NGN\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?).*$

Zenith Bank Template
regex^.*Acct:\s*(\d{3}\*{4}\d{3})\s*(CR|DR):\s*NGN\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*Desc:\s*(.+?)\s*Bal:\s*NGN\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*Date:\s*(\d{2})-([A-Z]{3})-(\d{4})\s+(\d{2}):(\d{2}).*$

Kuda Template
regex^.*Kuda\s*(Credit|Debit)\s*Alert.*(?:You\s+(?:spent|received))\s*NGN\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?).*(?:Merchant|From):\s*(.+?)\s*Balance:\s*NGN\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*Time:\s*(\d{2}):(\d{2}).*$

Parse Confidence Scoring
High Confidence (all required fields extracted)

Amount extracted ✓
Transaction type (CR/DR) detected ✓
Date extracted ✓
Merchant/sender extracted ✓
Balance extracted ✓

Medium Confidence (required fields only)

Amount extracted ✓
Transaction type detected ✓
Date extracted ✓
Merchant/sender missing ✗
Balance missing ✗

Low Confidence (fallback heuristics used)

Amount extracted via fallback pattern ✓
Transaction type inferred from keywords ✓
Date missing (use SMS timestamp) ✗

Edge Case Handling
Amount Formatting Variations
regex# With comma separators
(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)

# Without comma separators
(\d+(?:\.\d{2})?)

# With currency symbol
(?:NGN|₦)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)
Date Fallback Strategy

Try bank-specific date pattern
Try universal DD-Mon-YYYY pattern
Try DD/MM/YYYY pattern
Fall back to SMS timestamp

Merchant Name Cleaning
regex# Remove common prefixes
^(?:Transfer from|Transfer to|From|To)\s+(.+)$

# Remove trailing whitespace and newlines
(.+?)\s*(?:\n|$)

# Normalize multiple spaces
\s{2,} → single space
Testing Validation Checklist
For each bank template, verify:

 Sender ID correctly identifies the institution
 Amount extraction handles comma separators
 Amount extraction handles decimal places
 Credit/Debit detection is accurate
 Date extraction produces valid YYYY-MM-DD format
 Merchant extraction captures full name without truncation
 Balance extraction handles comma separators
 Account number extraction (full or masked) works
 Template handles multi-line SMS structure
 Template handles variations in whitespace
 Failed extractions trigger low confidence flag
 Duplicate detection works across same-bank alerts

Implementation Notes
Regex Flags

Use case-insensitive flag i for sender identification only
Use multiline flag m for patterns matching across lines
Do not use global flag g for extraction (capture first match only)

Performance Considerations

Compile regex patterns once at app initialization
Cache compiled patterns by sender ID
Apply sender filter before running expensive regex patterns
Limit regex backtracking with possessive quantifiers where supported

Maintenance Protocol
When adding support for a new bank:

Collect at least 10 real SMS samples (5 credit, 5 debit)
Identify all format variations
Write sender ID pattern
Write field extraction patterns
Write complete template pattern
Test against all 10 samples
Achieve 100% accuracy before deployment
Document in this skill file