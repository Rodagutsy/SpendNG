/**
 * Formats a number as a currency string for SpendNG.
 * Rules from component-library.md:
 * - Always show two decimal places: ₦4,500.00 not ₦4,500
 * - Use comma thousands separator: ₦1,250,000.00
 * - No space between symbol and number
 */
export function formatCurrency(amount: number, currency: string = 'NGN'): string {
  const symbol = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '';
  
  const formatter = new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${symbol}${formatter.format(Math.abs(amount))}`;
}

export function formatPercentage(value: number): string {
  const sign = value >= 0 ? '↑' : '↓';
  return `${sign}${Math.abs(Math.round(value))}%`;
}
