import type { DocumentEditor, FormFieldData } from '@syncfusion/ej2-documenteditor';
import type { EmployeeRecord, FormFieldKind, FormFieldModel } from '@/types';
import { toUsCurrency, toUsDate } from '@/utils/format';

/** Syncfusion's own auto-generated name on insertFormField, e.g. "Text14", "Check2", "Drop1". */
const GENERIC_NAME_RE = /^(Text|CheckBox|DropDown|Check|Drop)\d+$/;

/** Raw result of scanning one form field straight off the document. */
export interface ScannedField {
  /** Name as currently found in the doc. */
  currentName: string;
  kind: FormFieldKind;
  /** Current value: text content, 'true'/'false' for checkboxes, selected item for dropdowns. */
  value: string;
  dropdownItems?: string[];
}

type AnyFormFieldInfo = Record<string, unknown>;

function detectKind(info: AnyFormFieldInfo): FormFieldKind {
  if ('dropdownItems' in info) return 'DropDown';
  if ('sizeType' in info) return 'CheckBox';
  return 'Text';
}

/**
 * Scans every form field in the document. Structural info (type, dropdown options)
 * comes from getFormFieldInfo; current *values* come from exportFormData — Syncfusion
 * keys form-field structure and form-field data through two separate APIs.
 */
export function scanFormFields(editor: DocumentEditor): ScannedField[] {
  const names = editor.getFormFieldNames();
  const values = new Map(editor.exportFormData().map((d) => [d.fieldName, d.value]));

  return names.map((currentName) => {
    const info = editor.getFormFieldInfo(currentName) as unknown as AnyFormFieldInfo;
    const kind = detectKind(info);
    const raw = values.get(currentName);
    const dropdownItems = kind === 'DropDown' ? (info.dropdownItems as string[]) : undefined;
    // DropDown FormFieldData values are the *selected index* into dropdownItems, not the
    // label string (confirmed empirically — exportFormData returns e.g. 0, not "Engineering").
    const value =
      kind === 'CheckBox'
        ? String(Boolean(raw))
        : kind === 'DropDown'
          ? (dropdownItems?.[typeof raw === 'number' ? raw : Number(raw)] ?? '')
          : raw == null
            ? ''
            : String(raw);
    return { currentName, kind, value, dropdownItems };
  });
}

/** Resolves a DropDown field's selected *label* to the numeric index importFormData expects. */
export function dropdownIndexFor(options: string[] | undefined, label: string): number {
  const index = (options ?? []).indexOf(label);
  return index >= 0 ? index : 0;
}

/** One field's value mapped from an EmployeeRecord, in the shape (label vs wire) the caller asks for. */
export interface MappedFieldValue {
  /** Human-readable value for panel/model state. */
  label: string;
  /** Value as importFormData expects it: numeric index for DropDown, string otherwise. */
  wire: FormFieldData['value'];
}

/**
 * Maps every field whose name matches an EmployeeRecord key to that record's value,
 * applying US date formatting and DropDown label→index conversion. Shared by the
 * single-record panel auto-fill and the cohort mail-merge loop so they stay identical.
 */
export function mapRecordToFields(
  fields: FormFieldModel[],
  record: EmployeeRecord,
): Map<string, MappedFieldValue> {
  const dict = record as unknown as Record<string, string | number | undefined>;
  const out = new Map<string, MappedFieldValue>();
  for (const f of fields) {
    if (!(f.name in dict)) continue;
    const source = dict[f.name];
    if (source == null) continue;
    const raw = String(source);
    const label =
      f.name === 'startDate'
        ? toUsDate(raw)
        : f.name === 'annualSalary'
          ? toUsCurrency(Number(source))
          : raw;
    const wire = f.kind === 'DropDown' ? dropdownIndexFor(f.options, label) : label;
    out.set(f.name, { label, wire });
  }
  return out;
}

/**
 * Assigns a stable, business-meaningful-shaped identifier to any field still carrying
 * Syncfusion's generic auto-generated name (e.g. "Text14") — i.e. one nobody ever renamed.
 * Returns the map of oldName -> newName applied.
 *
 * This is the reliable, empirically-verified definition of "unnamed" for this API: setting a
 * field's name to a literal empty string orphans it from the document's bookmark-name
 * registry (getFormFieldNames() then never surfaces it again — confirmed by testing), so a
 * generic default name is what an unaddressed field actually looks like in practice, and
 * renaming *between two non-empty names* is the well-behaved path setFormFieldInfo supports.
 *
 * NOTE: getFormFieldInfo/setFormFieldInfo are keyed by the field's *current name*. If two
 * fields ever shared the exact same non-empty name there'd be no way to address one without
 * the other — but generic auto-generated names are unique by construction (Syncfusion
 * increments a counter per insertion), so that ambiguity doesn't arise here.
 */
export function autoNameGenericFields(editor: DocumentEditor, scanned: ScannedField[]): Map<string, string> {
  const renamed = new Map<string, string>();
  const usedNames = new Set(scanned.map((f) => f.currentName));
  let counter = 0;

  for (const field of scanned) {
    if (!GENERIC_NAME_RE.test(field.currentName)) continue;

    let candidate: string;
    do {
      candidate = `Field_${field.kind}_${++counter}`;
    } while (usedNames.has(candidate));
    usedNames.add(candidate);

    const info = editor.getFormFieldInfo(field.currentName) as unknown as AnyFormFieldInfo;
    editor.setFormFieldInfo(field.currentName, { ...info, name: candidate } as never);
    renamed.set(field.currentName, candidate);
  }
  return renamed;
}

/** Derives a human-readable panel label from a field name, e.g. "addressLine1" -> "Address Line 1". */
export function labelFromFieldName(name: string): string {
  const autoNamed = /^Field_(Text|CheckBox|DropDown)_(\d+)$/.exec(name);
  if (autoNamed) {
    const [, kind, n] = autoNamed;
    return `Unnamed ${kind} Field ${n}`;
  }
  const spaced = name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
