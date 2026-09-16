import type { FormFieldModel } from '@/types';
import { isUsPhone, isUsStateCode, isUsZip } from '@/utils/format';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const US_DATE_RE = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;
const CURRENCY_RE = /^\$?\d{1,3}(,\d{3})*(\.\d{2})?$|^\$?\d+(\.\d{2})?$/;

/**
 * Fields that never block generation. Predefined templates no longer carry bound employee
 * signature / signed-date fields (those are plain wet-signature rules now), but the
 * `*Signature` guard stays so any such field a user adds to a session template won't block
 * Generate either.
 */
const OPTIONAL_FIELD_NAMES = new Set(['addressLine2']);

/** True when a field should never block generation. */
function isOptionalField(name: string): boolean {
  return OPTIONAL_FIELD_NAMES.has(name) || name.toLowerCase().endsWith('signature');
}

type Rule = (value: string) => string | undefined;

/** Exact-name format validators, layered on top of the required check. */
const FORMAT_RULES: Record<string, Rule> = {
  email: (v) => (EMAIL_RE.test(v) ? undefined : 'Enter a valid email address.'),
  phone: (v) => (isUsPhone(v) ? undefined : 'Use US phone format: (XXX) XXX-XXXX.'),
  zip: (v) => (isUsZip(v) ? undefined : 'Use a US ZIP code: 12345 or 12345-6789.'),
  state: (v) => (isUsStateCode(v.toUpperCase()) ? undefined : 'Use a 2-letter US state code, e.g. CA.'),
  startDate: (v) => (US_DATE_RE.test(v) ? undefined : 'Use US date format: MM/DD/YYYY.'),
};

/**
 * True when a field name denotes a US calendar date (drives the panel's DatePicker control).
 * Matches `dateOfBirth` anywhere (so `dependentDateOfBirth` counts) plus any `*Date` suffix.
 */
export function isDateField(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.includes('dateofbirth') || lower.endsWith('date');
}

const usDateRule: Rule = (v) => (US_DATE_RE.test(v) ? undefined : 'Use US date format: MM/DD/YYYY.');
const usPhoneRule: Rule = (v) => (isUsPhone(v) ? undefined : 'Use US phone format: (XXX) XXX-XXXX.');
const emailRule: Rule = (v) => (EMAIL_RE.test(v) ? undefined : 'Enter a valid email address.');
const zipRule: Rule = (v) => (isUsZip(v) ? undefined : 'Use a US ZIP code: 12345 or 12345-6789.');
const stateRule: Rule = (v) =>
  isUsStateCode(v.toUpperCase()) ? undefined : 'Use a 2-letter US state code, e.g. CA.';
const currencyRule: Rule = (v) =>
  CURRENCY_RE.test(v.trim()) ? undefined : 'Enter an amount, e.g. $95,000 or 95000.00.';
const percentRule: Rule = (v) => {
  const n = Number(v.replace(/[%\s]/g, ''));
  return Number.isFinite(n) && n >= 0 && n <= 100 ? undefined : 'Enter a percentage between 0 and 100.';
};
const integerRule: Rule = (v) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 ? undefined : 'Enter a whole number.';
};

/**
 * Resolves the format rule for a field: an exact-name match first, then a suffix convention
 * so every semantic field (date/phone/email/zip/state/currency/percent/quantity) validates
 * consistently regardless of which template it appears in. Relationship (combo) fields carry
 * no format rule — free text is allowed; the base required check still applies.
 */
function ruleForField(name: string): Rule | undefined {
  if (FORMAT_RULES[name]) return FORMAT_RULES[name];
  if (isDateField(name)) return usDateRule;
  const lower = name.toLowerCase();
  if (lower.endsWith('phone')) return usPhoneRule;
  if (lower.endsWith('email')) return emailRule;
  if (lower === 'zip') return zipRule;
  if (lower === 'state') return stateRule;
  if (lower.endsWith('salary') || lower.endsWith('amount')) return currencyRule;
  if (lower.endsWith('percent')) return percentRule;
  if (lower === 'quantity') return integerRule;
  return undefined;
}

/** Validates one field and returns its updated valid/validationMessage state. */
export function validateField(field: FormFieldModel): Pick<FormFieldModel, 'valid' | 'validationMessage'> {
  // Checkboxes are never "empty" — true/false are both valid states.
  if (field.kind === 'CheckBox') {
    return { valid: true, validationMessage: undefined };
  }

  const value = field.value.trim();
  const isOptional = isOptionalField(field.name) || !field.required;

  if (!value) {
    if (isOptional) return { valid: true, validationMessage: undefined };
    return { valid: false, validationMessage: 'This field is required.' };
  }

  const formatCheck = ruleForField(field.name)?.(value);
  if (formatCheck) return { valid: false, validationMessage: formatCheck };

  return { valid: true, validationMessage: undefined };
}

/** Runs validateField over every field, returning a new array with updated valid/message. */
export function validateAll(fields: FormFieldModel[]): FormFieldModel[] {
  return fields.map((field) => ({ ...field, ...validateField(field) }));
}

/** True if every field currently passes validation. */
export function isDocumentValid(fields: FormFieldModel[]): boolean {
  return fields.every((f) => f.valid);
}
