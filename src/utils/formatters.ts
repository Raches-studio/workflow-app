// src/utils/formatters.ts

/**
 * Format seconds into HH:MM:SS format (e.g., 01:24:05)
 */
export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const pad = (num: number) => num.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Format seconds into human readable format (e.g., "1h 45m" or "25m")
 */
export function formatDurationHuman(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours === 0 && minutes === 0) {
    return `${Math.floor(totalSeconds)}s`;
  }
  if (hours === 0) {
    return `${minutes}m`;
  }
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}m`;
}

/**
 * Format currency with locale precision
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date string (YYYY-MM-DD) into readable label
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return 'No deadline';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

/**
 * Check if a date string is past due
 */
export function isOverdue(dateString?: string): boolean {
  if (!dateString) return false;
  const target = new Date(dateString).getTime();
  const now = new Date().setHours(0, 0, 0, 0);
  return target < now;
}
