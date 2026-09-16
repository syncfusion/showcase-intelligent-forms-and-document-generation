/**
 * Shared US-region formatting helpers. Every date, phone, address, and currency
 * value that reaches a document or the panel goes through one of these so the
 * whole app stays consistently en-US (per CLAUDE.md demo requirement).
 */

/** Formats an ISO (yyyy-MM-dd) date as US-style MM/DD/YYYY. Returns input unchanged if unparsable. */
export function toUsDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  if (!match) return isoDate;
  const [, year, month, day] = match;
  return `${month}/${day}/${year}`;
}

/** Formats a Date as US-style MM/DD/YYYY. */
export function dateToUs(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${mm}/${dd}/${date.getFullYear()}`;
}

/** Parses an MM/DD/YYYY string to a Date, or null if it isn't a valid calendar date. */
export function parseUsDate(value: string): Date | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!m) return null;
  const [, mm, dd, yyyy] = m;
  const month = Number(mm) - 1;
  const day = Number(dd);
  const year = Number(yyyy);
  const date = new Date(year, month, day);
  // Reject rollovers like 02/31/2026.
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) return null;
  return date;
}

const US_PHONE = /^\(\d{3}\) \d{3}-\d{4}$/;

/** True if a string is already in US phone format: (XXX) XXX-XXXX */
export function isUsPhone(value: string): boolean {
  return US_PHONE.test(value.trim());
}

/** Best-effort normalization of a 10-digit string into (XXX) XXX-XXXX. */
export function toUsPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 10) return value;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

const US_ZIP = /^\d{5}(-\d{4})?$/;

/** True if a string is a valid US ZIP or ZIP+4. */
export function isUsZip(value: string): boolean {
  return US_ZIP.test(value.trim());
}

/** Formats a number as US currency, e.g. 168000 -> "$168,000.00". */
export function toUsCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

const US_STATE = /^[A-Z]{2}$/;

/** True if a string looks like a two-letter USPS state/territory code. */
export function isUsStateCode(value: string): boolean {
  return US_STATE.test(value.trim());
}

/** Combines address parts into a single US-style line: "City, ST 12345". */
export function formatCityStateZip(city: string, state: string, zip: string): string {
  return `${city}, ${state} ${zip}`;
}
