import { database } from './database';

export const DEFAULT_CATEGORIES = [
  { id: 'cat-01', name: 'Food & Dining', type: 'debit', icon: 'utensils', color: '#FF6B35' },
  { id: 'cat-02', name: 'Transport', type: 'debit', icon: 'car', color: '#4ECDC4' },
  { id: 'cat-03', name: 'Utilities & Bills', type: 'debit', icon: 'zap', color: '#FFE66D' },
  { id: 'cat-04', name: 'Airtime & Data', type: 'debit', icon: 'wifi', color: '#A8E6CF' },
  { id: 'cat-05', name: 'Transfers Sent', type: 'debit', icon: 'arrow-up-right', color: '#C5C3BF' },
  { id: 'cat-06', name: 'Transfers Received', type: 'credit', icon: 'arrow-down-left', color: '#99BBFF' },
  { id: 'cat-07', name: 'Salary & Wages', type: 'credit', icon: 'briefcase', color: '#0B5CFF' },
  { id: 'cat-08', name: 'Business Income', type: 'credit', icon: 'chart-up', color: '#00AACC' },
  { id: 'cat-09', name: 'Shopping', type: 'debit', icon: 'shopping-bag', color: '#FF9999' },
  { id: 'cat-10', name: 'Entertainment', type: 'debit', icon: 'clapperboard', color: '#CC99FF' },
  { id: 'cat-11', name: 'Health', type: 'debit', icon: 'stethoscope', color: '#FF6666' },
  { id: 'cat-12', name: 'Education', type: 'debit', icon: 'graduation-cap', color: '#66B2FF' },
  { id: 'cat-13', name: 'Rent & Housing', type: 'debit', icon: 'home', color: '#997300' },
  { id: 'cat-14', name: 'Uncategorized', type: 'both', icon: 'help-circle', color: '#ADAAA4' },
];

export async function seedCategories() {
  const categoriesCollection = database.get('categories');
  const count = await categoriesCollection.query().fetchCount();
  
  if (count === 0) {
    await database.write(async () => {
      await Promise.all(
        DEFAULT_CATEGORIES.map(cat => 
          categoriesCollection.create(record => {
            record._raw.id = cat.id;
            record.name = cat.name;
            record.transactionTypeHint = cat.type as any;
            record.iconIdentifier = cat.icon;
            record.colorHex = cat.color;
            record.isSystem = true;
          })
        )
      );
    });
  }
}
