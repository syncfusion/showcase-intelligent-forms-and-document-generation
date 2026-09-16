import type { FormFieldModel } from '@/types';

export interface FormProgress {
  /** Count of required fields that are non-empty and valid. */
  complete: number;
  /** Count of required fields. */
  required: number;
  /** 0–100, rounded. 100 when there are no required fields. */
  pct: number;
  /** Required fields failing a format rule. */
  invalid: FormFieldModel[];
  /** Required fields still empty. */
  missing: FormFieldModel[];
  /** True when every required field is complete and valid. */
  ready: boolean;
  /** Short human summary of what's blocking generation, or '' when ready. */
  blocker: string;
}

function isEmpty(f: FormFieldModel): boolean {
  if (f.kind === 'CheckBox') return f.value !== 'true';
  return f.value.trim() === '';
}

function names(fields: FormFieldModel[], max = 2): string {
  const shown = fields.slice(0, max).map((f) => f.label).join(', ');
  return fields.length > max ? `${shown}…` : shown;
}

/** Derives the field-panel progress bar / blocker summary from the current field models. */
export function computeProgress(fields: FormFieldModel[]): FormProgress {
  const required = fields.filter((f) => f.required);
  const invalid = required.filter((f) => !f.valid);
  const missing = required.filter((f) => f.valid && isEmpty(f));
  const complete = required.filter((f) => f.valid && !isEmpty(f)).length;
  const pct = required.length === 0 ? 100 : Math.round((complete / required.length) * 100);
  const ready = invalid.length === 0 && missing.length === 0;

  let blocker = '';
  if (invalid.length) {
    blocker = `${invalid.length} field${invalid.length > 1 ? 's' : ''} invalid: ${names(invalid)}`;
  } else if (missing.length) {
    blocker = `${missing.length} required field${missing.length > 1 ? 's' : ''} still empty: ${names(missing)}`;
  }

  return { complete, required: required.length, pct, invalid, missing, ready, blocker };
}
