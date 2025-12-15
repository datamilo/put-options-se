import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateDefaultExpiryDate(availableExpiryDates: string[]): string | null {
  if (availableExpiryDates.length === 0) return null;

  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

  // Find first Friday of next month
  const firstFriday = new Date(nextMonth);
  const dayOfWeek = firstFriday.getDay();
  const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
  firstFriday.setDate(firstFriday.getDate() + daysUntilFriday);

  // Third Friday is 14 days after first Friday
  const thirdFriday = new Date(firstFriday);
  thirdFriday.setDate(thirdFriday.getDate() + 14);

  // Find the expiry date closest to third Friday
  let closestDate = availableExpiryDates[0];
  let smallestDiff = Infinity;

  availableExpiryDates.forEach(dateStr => {
    const expiryDate = new Date(dateStr);
    const diff = Math.abs(expiryDate.getTime() - thirdFriday.getTime());
    if (diff < smallestDiff) {
      smallestDiff = diff;
      closestDate = dateStr;
    }
  });

  return closestDate;
}

export function formatNumber(value: any, field: string = '') {
  if (value === null || value === undefined || value === 'NaN' || value === '') return '-';

  if (typeof value === 'number') {
    if (field.includes('Pct') || field.includes('Prob') || field === 'ImpliedVolatility' || field === 'Mean_Accuracy' || field === 'AllMedianIV_Maximum100DaysToExp' || field === 'TodayStockMedianIV_Maximum100DaysToExp' || field === 'WorstHistoricalDecline' || field === 'BadHistoricalDecline' || field === 'ImpliedVolatilityUntilExpiry' || field === 'Historical100DaysWorstDecline' || field === 'Historical50DaysWorstDecline' || field === '2008_100DaysWorstDecline' || field === '2008_50DaysWorstDecline') {
      return `${(value * 100).toLocaleString('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
    }
    if (field === 'Premium' || field === 'Underlying_Value' || field === 'PotentialLossAtLowerBound') {
      return Math.round(value).toLocaleString('sv-SE');
    }
    if (field === 'DaysToExpiry' || field === 'X-Day' || field.includes('Number')) {
      return Math.round(value).toLocaleString('sv-SE');
    }
    // If absolute value is >= 1000, display without decimals
    if (Math.abs(value) >= 1000) {
      return Math.round(value).toLocaleString('sv-SE');
    }
    if (field.includes('Loss') || field.includes('Price') || field.includes('Bid') || field.includes('Value')) {
      return value.toLocaleString('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return value.toLocaleString('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return String(value);
}
