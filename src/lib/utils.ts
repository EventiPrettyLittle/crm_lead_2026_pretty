import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formatta una data in orario italiano (Europe/Rome) — evita il bug UTC su Vercel
export function formatIT(date: Date | string | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('it-IT', { timeZone: 'Europe/Rome', ...opts });
}

export function formatITDate(date: Date | string | null | undefined): string {
  return formatIT(date, { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatITDateTime(date: Date | string | null | undefined): string {
  return formatIT(date, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatITTime(date: Date | string | null | undefined): string {
  return formatIT(date, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}
export function getInitials(name?: string | null): string {
  if (!name) return '??';
  return name
    .split(' ')
    .filter(part => part.length > 0)
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 3);
}
