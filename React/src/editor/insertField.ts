import type { DocumentEditor, FormFieldType } from '@syncfusion/ej2-documenteditor';
import type { FormFieldKind } from '@/types';

/** A field the authoring "Insert Fields" palette can drop into the document. */
export interface InsertFieldDef {
  /** Human label shown in the palette and written before the field, e.g. "Full Name". */
  label: string;
  /** Bound form-field name — kept aligned to EmployeeRecord keys so fill-mode auto-fills it. */
  name: string;
  kind: FormFieldKind;
  /** Options for DropDown fields. */
  options?: string[];
}

const KIND_MAP: Record<FormFieldKind, FormFieldType> = {
  Text: 'Text',
  CheckBox: 'CheckBox',
  DropDown: 'DropDown',
};

/** Ensures a proposed field name is unique within the document. */
function uniqueName(editor: DocumentEditor, base: string): string {
  const existing = new Set(editor.getFormFieldNames());
  if (!existing.has(base)) return base;
  let i = 2;
  while (existing.has(`${base}${i}`)) i++;
  return `${base}${i}`;
}

/** Inserts a single form field at the caret and renames it (Syncfusion auto-names on insert). */
export function insertNamedField(
  editor: DocumentEditor,
  kind: FormFieldKind,
  name: string,
  options?: string[],
): string {
  const before = new Set(editor.getFormFieldNames());
  editor.editor.insertFormField(KIND_MAP[kind]);
  const autoName = editor.getFormFieldNames().find((n) => !before.has(n)) ?? '';
  const info = editor.getFormFieldInfo(autoName) as unknown as Record<string, unknown>;
  const finalName = uniqueName(editor, name);
  const next: Record<string, unknown> = { ...info, name: finalName };
  if (kind === 'DropDown' && options) next.dropdownItems = options;
  editor.setFormFieldInfo(autoName, next as never);
  if (kind === 'DropDown' && options && options.length) {
    // DropDown FormFieldData is a numeric index into dropdownItems; seed the first option.
    editor.importFormData([{ fieldName: finalName, value: 0 }]);
  }
  return finalName;
}

/** Inserts a bold label + ": " then the bound field at the caret (authoring insert). */
export function insertLabeledField(editor: DocumentEditor, def: InsertFieldDef): string {
  const sel = editor.selection;
  const ed = editor.editor;
  sel.characterFormat.bold = true;
  ed.insertText(`${def.label}: `);
  sel.characterFormat.bold = false;
  const name = insertNamedField(editor, def.kind, def.name, def.options);
  ed.insertText('  ');
  return name;
}

/** Derives a camelCase field name from a free-text label, e.g. "Cost Center" -> "costCenter". */
export function toFieldName(label: string): string {
  const words = label
    .trim()
    .replace(/[^A-Za-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return 'customField';
  return words
    .map((w, i) => (i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join('');
}
