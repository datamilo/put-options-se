/**
 * Nordic Number Formatting Utilities
 *
 * Nordic/European standard formatting:
 * - Thousand separator: non-breaking space (or regular space)
 * - Decimal separator: comma
 *
 * Examples:
 * - 1000 → "1 000"
 * - 1000000 → "1 000 000"
 * - 10.5 → "10,5"
 * - 1234567.89 → "1 234 567,89"
 */

/**
 * Format a number using Nordic/European standards
 * @param value The number to format
 * @param decimals Number of decimal places to show (default: 0)
 * @returns Formatted string in Nordic format
 */
export function formatNordicNumber(value: number, decimals: number = 0): string {
  if (isNaN(value)) return '-';

  // Format with specified decimal places
  const formatter = new Intl.NumberFormat('sv-SE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return formatter.format(value);
}

/**
 * Format a percentage using Nordic standards
 * @param value The number to format as percentage (e.g., 0.5 for 50%)
 * @param decimals Number of decimal places (default: 2)
 * @returns Formatted string (e.g., "50,00%")
 */
export function formatNordicPercentage(value: number, decimals: number = 2): string {
  if (isNaN(value)) return '-';

  const formatter = new Intl.NumberFormat('sv-SE', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return formatter.format(value);
}

/**
 * Format a number as currency (SEK)
 * @param value The number to format
 * @param decimals Number of decimal places (default: 0 for SEK)
 * @returns Formatted string (e.g., "1 234 567 kr")
 */
export function formatNordicCurrency(value: number, decimals: number = 0): string {
  if (isNaN(value)) return '-';

  const formatter = new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return formatter.format(value);
}

/**
 * Format a decimal number with specified decimal places using Nordic standards
 * @param value The number to format
 * @param decimals Number of decimal places (default: 2)
 * @returns Formatted string (e.g., "87,66")
 */
export function formatNordicDecimal(value: number, decimals: number = 2): string {
  if (isNaN(value)) return '-';

  return formatNordicNumber(value, decimals);
}

/**
 * Format percentage points (pp) using Nordic standards
 * @param value The value in percentage points (e.g., 24.55 for +24.55 pp)
 * @param decimals Number of decimal places (default: 2)
 * @returns Formatted string (e.g., "+24,55 pp")
 */
export function formatNordicPercentagePoints(value: number, decimals: number = 2): string {
  if (isNaN(value)) return '-';

  const formatted = formatNordicNumber(value, decimals);
  const sign = value > 0 ? '+' : '';
  return `${sign}${formatted} pp`;
}
