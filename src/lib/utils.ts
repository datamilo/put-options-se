import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(value: any, field: string = '') {
  if (value === null || value === undefined || value === 'NaN' || value === '') return '-';
  
  if (typeof value === 'number') {
    if (field.includes('Pct') || field.includes('Prob') || field === 'ImpliedVolatility' || field === 'Mean_Accuracy' || field === 'AllMedianIV_Maximum100DaysToExp' || field === 'TodayStockMedianIV_Maximum100DaysToExp') {
      return `${(value * 100).toLocaleString('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
    }
    if (field === 'Premium' || field === 'Underlying_Value') {
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
