import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  value: number,
  currency: 'USD' | 'PKR' = 'USD',
  language: 'en' | 'ur' = 'en'
) {
  // Basic locale preference: use language; fall back to region-specific for PKR
  const locale = currency === 'PKR' ? `${language}-PK` : language
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    // Fallback simple formatting
    const symbol = currency === 'PKR' ? '₨' : '$'
    return `${symbol}${(Number(value) || 0).toFixed(2)}`
  }
}
