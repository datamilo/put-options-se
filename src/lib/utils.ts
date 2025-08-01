import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(value: any, field: string = '') {
  if (value === null || value === undefined || value === 'NaN' || value === '') return '-';
  
  if (typeof value === 'number') {
    if (field.includes('Pct') || field.includes('Prob') || field === 'ImpliedVolatility' || field.includes('Accuracy')) {
      return `${(value * 100).toLocaleString('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
    }
    if (field.includes('Loss') || field === 'Premium' || field.includes('Price') || field.includes('Bid') || field.includes('Value')) {
      return value.toLocaleString('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (field === 'DaysToExpiry' || field === 'X-Day' || field.includes('Number')) {
      return Math.round(value).toLocaleString('sv-SE');
    }
    return value.toLocaleString('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  
  return String(value);
}
