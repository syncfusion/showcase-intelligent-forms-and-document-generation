import type { DocumentEditor } from '@syncfusion/ej2-documenteditor';
import type { EmployeeRecord, ExportFormat, FormFieldModel } from '@/types';
import { mapRecordToFields } from './useFormFields';
import { saveDocxBlob, exportImagePdfBlob } from './exporters';

/** One token substitution: replaces every literal «key» occurrence with value. */
export interface MergeToken {
  key: string;
  value: string;
}

export interface MergeResult {
  /** Total number of «token» occurrences replaced. */
  replacedCount: number;
  /** Distinct token keys that had at least one match. */
  replacedKeys: string[];
}

/**
 * Classic mail-merge token replacement (CLAUDE.md §6.2) — search/replace of literal
 * «FieldName» text runs in the document body. Used by the cohort mail-merge loop, which
 * always runs it against a reopened pristine copy of the template (non-destructive).
 */
export function applyMailMerge(editor: DocumentEditor, tokens: MergeToken[]): MergeResult {
  let replacedCount = 0;
  const replacedKeys: string[] = [];
  for (const { key, value } of tokens) {
    if (!value) continue;
    editor.search.findAll(`«${key}»`);
    const results = editor.search.searchResults;
    const matchCount = results.length;
    // Read the count *before* replaceAll — it clears the search-results collection as a
    // side effect (the matched text no longer exists once replaced), so reading it after
    // always reported 0 (confirmed empirically: the doc replaced correctly, the count didn't).
    if (matchCount > 0) {
      results.replaceAll(value);
      replacedCount += matchCount;
      replacedKeys.push(key);
    }
  }
  editor.search.searchResults.clear();
  return { replacedCount, replacedKeys };
}


/**
 * Candidate «token» substitutions taken from the operator's current form-field values —
 * used by single-record Generate so a template's `«token»` prose (letters, the Onboarding
 * trailing line) renders the real values in the output, not the literal placeholders.
 */
export function tokensFromFields(fields: FormFieldModel[]): MergeToken[] {
  return fields.filter((f) => f.value.trim() !== '').map((f) => ({ key: f.name, value: f.value }));
}

/** One finished document in a cohort run. */
export interface CohortFile {
  /** File name including extension. */
  name: string;
  blob: Blob;
}

export interface CohortProgress {
  done: number;
  total: number;
  /** Human label for the record currently being processed. */
  label: string;
}

interface CohortOptions {
  format: ExportFormat;
  /** File-name stem, e.g. "Employee Onboarding". */
  baseName: string;
  onProgress?: (p: CohortProgress) => void;
}

const settle = () => new Promise<void>((resolve) => window.setTimeout(resolve, 30));

/**
 * «token» substitutions for one record: the record's own columns, overridden by the
 * name-formatted field values (US date/currency), plus any operator-authored field values.
 * Used by the cohort loop and by single-record Generate when a record is selected.
 */
export function tokensForRecord(fields: FormFieldModel[], record: EmployeeRecord): MergeToken[] {
  const merged = new Map<string, string>();
  // Every scalar column on the record is a candidate «token».
  for (const [key, value] of Object.entries(record)) {
    if (value != null && typeof value !== 'object') merged.set(key, String(value));
  }
  // Field-name-keyed values (with US date / label formatting) win over raw record columns.
  for (const [name, mapped] of mapRecordToFields(fields, record)) merged.set(name, mapped.label);
  // Operator-authored field values that aren't record-backed still merge into matching tokens.
  for (const f of fields) {
    if (f.source !== 'default' && f.value && !merged.has(f.name)) merged.set(f.name, f.value);
  }
  return [...merged].map(([key, value]) => ({ key, value }));
}

/**
 * Cohort mail merge (CLAUDE.md §6): for each selected record, reload a pristine copy of
 * the template, fill its form fields from the record, run classic «token» replacement,
 * and export the requested format(s) as blobs. The editor is restored to the operator's
 * pre-run state (document + form data) before this resolves.
 */
export async function generateCohort(
  editor: DocumentEditor,
  fields: FormFieldModel[],
  records: EmployeeRecord[],
  { format, baseName, onProgress }: CohortOptions,
): Promise<CohortFile[]> {
  const pristine = editor.serialize();
  const operatorFormData = editor.exportFormData();
  const files: CohortFile[] = [];
  const stem = baseName.replace(/[^\w\- ]+/g, '').trim() || 'Document';

  try {
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      onProgress?.({ done: i, total: records.length, label: `${record.fullName} (${record.id})` });

      editor.open(pristine);
      await settle();

      const formData = [...mapRecordToFields(fields, record)].map(([fieldName, m]) => ({
        fieldName,
        value: m.wire,
      }));
      if (formData.length) editor.importFormData(formData);
      applyMailMerge(editor, tokensForRecord(fields, record));
      await settle();

      const safeId = record.id.replace(/[^\w-]+/g, '');
      if (format === 'docx' || format === 'both') {
        files.push({ name: `${stem}-${safeId}.docx`, blob: await saveDocxBlob(editor) });
      }
      if (format === 'pdf' || format === 'both') {
        files.push({ name: `${stem}-${safeId}.pdf`, blob: await exportImagePdfBlob(editor) });
      }
    }
    onProgress?.({ done: records.length, total: records.length, label: 'Packaging…' });
  } finally {
    editor.open(pristine);
    window.setTimeout(() => editor.importFormData(operatorFormData), 0);
  }

  return files;
}
