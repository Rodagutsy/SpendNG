import { db, categories, rules } from '.';
import { count } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';

export const DEFAULT_CATEGORIES = [
  { id: 'cat-01', name: 'Food & Dining', type: 'debit', icon: 'utensils', color: '#FF6B35' },
  { id: 'cat-02', name: 'Transport', type: 'debit', icon: 'car', color: '#4ECDC4' },
  { id: 'cat-03', name: 'Utilities & Bills', type: 'debit', icon: 'zap', color: '#FFE66D' },
  { id: 'cat-04', name: 'Airtime & Data', type: 'debit', icon: 'wifi', color: '#A8E6CF' },
  { id: 'cat-05', name: 'Transfers Sent', type: 'debit', icon: 'arrow-up-right', color: '#C5C3BF' },
  { id: 'cat-06', name: 'Transfers Received', type: 'credit', icon: 'arrow-down-left', color: '#99BBFF' },
  { id: 'cat-07', name: 'Salary & Wages', type: 'credit', icon: 'briefcase', color: '#0B5CFF' },
  { id: 'cat-08', name: 'Business Income', type: 'credit', icon: 'briefcase', color: '#00AACC' },
  { id: 'cat-09', name: 'Shopping', type: 'debit', icon: 'shopping-bag', color: '#FF9999' },
  { id: 'cat-10', name: 'Entertainment', type: 'debit', icon: 'clapperboard', color: '#CC99FF' },
  { id: 'cat-11', name: 'Health', type: 'debit', icon: 'stethoscope', color: '#FF6666' },
  { id: 'cat-12', name: 'Education', type: 'debit', icon: 'graduation-cap', color: '#66B2FF' },
  { id: 'cat-13', name: 'Rent & Housing', type: 'debit', icon: 'home', color: '#997300' },
  { id: 'cat-14', name: 'Uncategorized', type: 'both', icon: 'help-circle', color: '#ADAAA4' },
];

const SYSTEM_RULES: Array<{ keyword: string; matchType: 'contains'; categoryId: string }> = [
  { keyword: 'shoprite', matchType: 'contains', categoryId: 'cat-01' },
  { keyword: 'kfc', matchType: 'contains', categoryId: 'cat-01' },
  { keyword: 'chicken republic', matchType: 'contains', categoryId: 'cat-01' },
  { keyword: 'dominos', matchType: 'contains', categoryId: 'cat-01' },
  { keyword: 'uber eats', matchType: 'contains', categoryId: 'cat-01' },
  { keyword: 'uber', matchType: 'contains', categoryId: 'cat-02' },
  { keyword: 'bolt', matchType: 'contains', categoryId: 'cat-02' },
  { keyword: 'dstv', matchType: 'contains', categoryId: 'cat-03' },
  { keyword: 'mtn', matchType: 'contains', categoryId: 'cat-04' },
  { keyword: 'airtel', matchType: 'contains', categoryId: 'cat-04' },
  { keyword: 'glo', matchType: 'contains', categoryId: 'cat-04' },
  { keyword: '9mobile', matchType: 'contains', categoryId: 'cat-04' },
  { keyword: 'jumia', matchType: 'contains', categoryId: 'cat-09' },
  { keyword: 'konga', matchType: 'contains', categoryId: 'cat-09' },
  { keyword: 'netflix', matchType: 'contains', categoryId: 'cat-10' },
  { keyword: 'showmax', matchType: 'contains', categoryId: 'cat-10' },
  { keyword: 'pharmacy', matchType: 'contains', categoryId: 'cat-11' },
  { keyword: 'hospital', matchType: 'contains', categoryId: 'cat-11' },
  { keyword: 'salary', matchType: 'contains', categoryId: 'cat-07' },
  { keyword: 'payroll', matchType: 'contains', categoryId: 'cat-07' },
  { keyword: 'rent', matchType: 'contains', categoryId: 'cat-13' },
];

export async function seedDatabase(): Promise<void> {
  const catCountResult = await db.select({ value: count() }).from(categories);
  const catCount = catCountResult[0]?.value || 0;

  if (catCount === 0) {
    const now = new Date();
    await db.insert(categories).values(
      DEFAULT_CATEGORIES.map(cat => ({
        id: cat.id,
        name: cat.name,
        iconIdentifier: cat.icon,
        colorHex: cat.color,
        transactionTypeHint: cat.type as 'credit' | 'debit' | 'both',
        isSystem: true,
        createdAt: now,
        updatedAt: now,
      }))
    );
  }

  const ruleCountResult = await db.select({ value: count() }).from(rules);
  const ruleCount = ruleCountResult[0]?.value || 0;

  if (ruleCount === 0) {
    const now = new Date();
    await db.insert(rules).values(
      SYSTEM_RULES.map((rule, index) => ({
        id: Crypto.randomUUID(),
        keyword: rule.keyword,
        matchType: rule.matchType,
        categoryId: rule.categoryId,
        priority: 50 - index,
        isSystem: true,
        createdAt: now,
        updatedAt: now,
      }))
    );
  }
}

export function getCategoryById(id: string): typeof DEFAULT_CATEGORIES[0] | undefined {
  return DEFAULT_CATEGORIES.find((c) => c.id === id);
}
