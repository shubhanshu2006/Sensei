// Date arithmetic

/**
 * Return a new Date that is `minutes` minutes after `date`.
 * Negative values move the date backwards.
 */
export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

/**
 * Return a new Date that is `days` days after `date`.
 * Negative values move the date backwards.
 */
export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

/**
 * Return a new Date that is `months` calendar months after `date`.
 * Day-of-month clamping follows the behaviour of `Date.setMonth` (e.g.
 * Jan 31 + 1 month → Feb 28/29 on most runtimes).
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

// ---------------------------------------------------------------------------
// Predicates
// ---------------------------------------------------------------------------

/**
 * Return `true` if `date` is strictly in the past relative to `Date.now()`.
 */
export function isExpired(date: Date): boolean {
  return date.getTime() < Date.now();
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/**
 * Format `date` as an ISO date string (`YYYY-MM-DD`) in UTC.
 * Strips the time component so the result is always exactly 10 characters.
 */
export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Measurement
// ---------------------------------------------------------------------------

/**
 * Return the number of whole minutes between `start` and `end`.
 * The result is always non-negative regardless of argument order.
 */
export function minutesBetween(start: Date, end: Date): number {
  return Math.floor(Math.abs(end.getTime() - start.getTime()) / 60_000);
}
