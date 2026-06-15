import { supabase } from './supabase';

const MERCHANT_CACHE = new Map<string, string | null>();

interface NormalizationRule {
  alias_pattern: string;
  canonical_name: string;
  match_type: 'normalized_equals' | 'contains' | 'regex';
  priority: number;
}

export class MerchantNormalizationEngine {
  static async normalize(merchantName: string | null): Promise<string | null> {
    if (!merchantName) return null;

    const key = merchantName.trim();
    if (MERCHANT_CACHE.has(key)) return MERCHANT_CACHE.get(key) ?? merchantName;

    const canonical = await this.lookup(key);
    MERCHANT_CACHE.set(key, canonical);
    return canonical ?? merchantName;
  }

  static clearCache(): void {
    MERCHANT_CACHE.clear();
  }

  private static async lookup(merchantName: string): Promise<string | null> {
    try {
      const { data: rules } = await supabase
        .from('merchant_normalization')
        .select('*')
        .order('priority', { ascending: false });

      if (!rules) return null;

      const normalizedInput = this.strip(merchantName);

      for (const rule of rules as NormalizationRule[]) {
        switch (rule.match_type) {
          case 'normalized_equals': {
            if (normalizedInput === this.strip(rule.alias_pattern)) {
              return rule.canonical_name;
            }
            break;
          }
          case 'contains': {
            if (normalizedInput.includes(rule.alias_pattern.toLowerCase())) {
              return rule.canonical_name;
            }
            break;
          }
          case 'regex': {
            try {
              if (new RegExp(rule.alias_pattern, 'i').test(merchantName)) {
                return rule.canonical_name;
              }
            } catch {
              /* skip invalid regex */
            }
            break;
          }
        }
      }
    } catch (err) {
      console.error('[MerchantNormalizationEngine] Lookup failed:', err);
    }

    return null;
  }

  private static strip(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]/g, '');
  }
}
