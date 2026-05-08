import { database } from '@/model/database';
import { Category, Rule } from '@/model/models';

export const SYSTEM_CATEGORIES = [
  { id: 'cat-01', name: 'Food & Dining', icon: 'fast-food', color: '#FF9800', type: 'debit' },
  { id: 'cat-02', name: 'Transport', icon: 'car', color: '#2196F3', type: 'debit' },
  { id: 'cat-03', name: 'Utilities & Bills', icon: 'flash', color: '#F44336', type: 'debit' },
  { id: 'cat-04', name: 'Airtime & Data', icon: 'phone-portrait', color: '#9C27B0', type: 'debit' },
  { id: 'cat-05', name: 'Transfers Sent', icon: 'arrow-forward', color: '#607D8B', type: 'debit' },
  { id: 'cat-06', name: 'Transfers Received', icon: 'arrow-back', color: '#4CAF50', type: 'credit' },
  { id: 'cat-07', name: 'Salary & Wages', icon: 'cash', color: '#009688', type: 'credit' },
  { id: 'cat-08', name: 'Business Income', icon: 'briefcase', color: '#795548', type: 'credit' },
  { id: 'cat-09', name: 'Shopping', icon: 'cart', color: '#E91E63', type: 'debit' },
  { id: 'cat-10', name: 'Entertainment', icon: 'play', color: '#3F51B5', type: 'debit' },
  { id: 'cat-11', name: 'Health', icon: 'medical', color: '#00BCD4', type: 'debit' },
  { id: 'cat-12', name: 'Education', icon: 'school', color: '#CDDC39', type: 'debit' },
  { id: 'cat-13', name: 'Rent & Housing', icon: 'home', color: '#8BC34A', type: 'debit' },
  { id: 'cat-14', name: 'Uncategorized', icon: 'help', color: '#9E9E9E', type: 'both' },
];

export const SYSTEM_RULES = [
  { keyword: 'shoprite', categoryId: 'cat-01', matchType: 'contains' },
  { keyword: 'spar', categoryId: 'cat-01', matchType: 'contains' },
  { keyword: 'uber', categoryId: 'cat-02', matchType: 'contains' },
  { keyword: 'bolt', categoryId: 'cat-02', matchType: 'contains' },
  { keyword: 'dstv', categoryId: 'cat-03', matchType: 'contains' },
  { keyword: 'gotv', categoryId: 'cat-03', matchType: 'contains' },
  { keyword: 'airtel', categoryId: 'cat-04', matchType: 'contains' },
  { keyword: 'mtn', categoryId: 'cat-04', matchType: 'contains' },
  { keyword: 'netflix', categoryId: 'cat-10', matchType: 'contains' },
  // Add more as per categorization-engine.md
];

export async function seedDatabase() {
  const categoryCount = await database.get('categories').query().fetchCount();
  if (categoryCount > 0) return;

  await database.write(async () => {
    // Seed Categories
    for (const cat of SYSTEM_CATEGORIES) {
      await database.get<Category>('categories').create(c => {
        c._raw.id = cat.id; // Force ID to match our spec
        c.name = cat.name;
        c.iconIdentifier = cat.icon;
        c.colorHex = cat.color;
        c.transactionTypeHint = cat.type as any;
        c.isSystem = true;
      });
    }

    // Seed Rules
    for (const rule of SYSTEM_RULES) {
      await database.get<Rule>('rules').create(r => {
        r.keyword = rule.keyword;
        r.categoryId = rule.categoryId;
        r.matchType = rule.matchType as any;
        r.priority = 1;
        r.isSystem = true;
      });
    }
  });
}
