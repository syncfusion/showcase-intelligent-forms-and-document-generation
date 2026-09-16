import type { FormFieldModel } from '@/types';
import { isDateField } from './validation';

/**
 * Which panel control renders for a field. This is decoupled from the *document* form-field
 * `kind`: a plain Text form field can still surface as a phone mask, currency spinner, or
 * editable combo box. Every control writes a plain string back through `onChange`, so the
 * document binding, «token» mail merge, auto-fill, and validation gating are unaffected.
 */
export type ControlKind =
  | 'text'
  | 'date'
  | 'phone'
  | 'email'
  | 'zip'
  | 'state'
  | 'currency'
  | 'integer'
  | 'percent'
  | 'combo'
  | 'dropdown'
  | 'checkbox';

/** Options offered by the editable relationship combo box (operator may also type their own). */
export const RELATIONSHIP_OPTIONS = [
  'Spouse',
  'Domestic Partner',
  'Parent',
  'Child',
  'Sibling',
  'Guardian',
  'Friend',
  'Colleague',
  'Other',
];

/**
 * Resolves the control for a field — exact field name first, then a name-suffix convention
 * that mirrors `validation.ts` `ruleForField`, so the control and its validation rule always
 * agree.
 */
export function resolveControl(field: FormFieldModel): { control: ControlKind; options?: string[] } {
  if (field.kind === 'CheckBox') return { control: 'checkbox' };
  if (field.kind === 'DropDown') return { control: 'dropdown', options: field.options };

  const name = field.name.toLowerCase();
  if (name.endsWith('relationship')) return { control: 'combo', options: RELATIONSHIP_OPTIONS };
  if (isDateField(field.name)) return { control: 'date' };
  if (name.endsWith('phone')) return { control: 'phone' };
  if (name.endsWith('email')) return { control: 'email' };
  if (name === 'zip') return { control: 'zip' };
  if (name === 'state') return { control: 'state' };
  if (name.endsWith('salary') || name.endsWith('amount')) return { control: 'currency' };
  if (name.endsWith('percent')) return { control: 'percent' };
  if (name === 'quantity') return { control: 'integer' };
  return { control: 'text' };
}
