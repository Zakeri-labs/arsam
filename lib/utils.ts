import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalizes Persian (۰-۹) and Arabic (٠-٩) digits to standard ASCII (0-9) digits.
 */
export function normalizeDigits(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return '';
  const str = String(input);
  return str
    .replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 1632));
}

/**
 * Parses numbers safely after normalizing Persian/Arabic digits.
 */
export function parseFormattedNumber(input: string | number | null | undefined): number {
  if (typeof input === 'number') return isNaN(input) ? 0 : input;
  if (!input) return 0;
  const normalized = normalizeDigits(input).replace(/,/g, '').trim();
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Converts string or number to standard English digits representation.
 */
export function toEnglishDigits(input: string | number | null | undefined): string {
  return normalizeDigits(input);
}

