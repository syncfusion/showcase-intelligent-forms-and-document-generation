import { useCallback, useEffect, useRef, useState } from 'react';
import type { DocumentEditor, DropDownFormFieldInfo, FormFieldData } from '@syncfusion/ej2-documenteditor';
import type { EmployeeRecord, FieldSource, FormFieldModel } from '@/types';
import { getDropdown } from '@/data/mockApi';
import { FIELD_TO_DROPDOWN_KEY } from '@/data/dropdowns';
import { validateField } from '@/panel/validation';
import { ownerOf, type DocType } from '@/panel/fieldOwner';
import {
  autoNameGenericFields,
  dropdownIndexFor,
  labelFromFieldName,
  mapRecordToFields,
  scanFormFields,
} from './useFormFields';

/**
 * Two-way binding glue between the Syncfusion document and the panel's React state.
 * Every programmatic write to the document is wrapped in withSyncGuard so the resulting
 * contentChange event(s) don't loop back into refreshFromDoc (CLAUDE.md §7).
 */
export interface FieldSyncApi {
  fields: FormFieldModel[];
  /** Scans the freshly loaded document, auto-names blank fields, and seeds panel state. */
  scanAndBind: () => void;
  /**
   * Re-reads the form-field list from the document (fields added/removed via the editor's
   * Developer tab) and merges it into panel state, preserving each still-present field's
   * value/provenance. Runs automatically when a change alters the field list, and on demand
   * from the scan report. Returns overall validity. Session-only — nothing is persisted.
   */
  rescan: () => boolean;
  /** Panel -> Doc: called when the operator edits a control in the side panel. */
  updateFromPanel: (name: string, rawValue: string) => void;
  /** Doc -> Panel: called (debounced) from the editor's contentChange handler. */
  refreshFromDoc: () => void;
  /** Auto-fills every field whose name matches an EmployeeRecord key, marking source 'db'. */
  applyRecordAutoFill: (record: EmployeeRecord) => void;
  /** Clears every field back to its scan-time default (source 'default') in both doc and panel. */
  resetForm: () => void;
  /** Re-runs validation over all fields; returns overall validity. */
  validateNow: () => boolean;
  /**
   * Owner-aware Generate gate. Refreshes validation, then splits invalids by owner:
   * HR-owned invalids block generation; employee-owned invalids are deferred (HR can generate
   * a partly-filled document to send to the new hire to complete).
   */
  validateForGenerate: (docType?: DocType) => { blocking: FormFieldModel[]; pendingEmployee: FormFieldModel[] };
  /** True while a programmatic doc write is in flight — exposed for callers that also touch the editor. */
  isSyncing: () => boolean;
  /** Field names whose dropdown options are currently being fetched from the mock backend. */
  loadingDropdowns: Set<string>;
}

export function useFieldSync(getEditor: () => DocumentEditor | null): FieldSyncApi {
  const [fields, setFields] = useState<FormFieldModel[]>([]);
  const fieldsRef = useRef(fields);
  fieldsRef.current = fields;

  const [loadingDropdowns, setLoadingDropdowns] = useState<Set<string>>(new Set());

  // Guards every programmatic write to the document so the resulting contentChange
  // event(s) don't loop back into refreshFromDoc (CLAUDE.md §7). A plain boolean flag set
  // false immediately after the write call isn't enough: Syncfusion's relayout can fire
  // contentChange asynchronously (observed straggling ~150-250ms after a multi-field
  // importFormData batch), so the guard is a counter released after a short delay rather
  // than synchronously, and withSyncGuard supports overlapping guarded writes safely.
  const syncingCountRef = useRef(0);
  const isSyncingNow = () => syncingCountRef.current > 0;
  const withSyncGuard = <T,>(fn: () => T): T => {
    syncingCountRef.current += 1;
    try {
      return fn();
    } finally {
      window.setTimeout(() => {
        syncingCountRef.current = Math.max(0, syncingCountRef.current - 1);
      }, 300);
    }
  };

  const debounceRef = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(debounceRef.current), []);

  const buildModels = useCallback((editor: DocumentEditor): FormFieldModel[] => {
    const scanned = scanFormFields(editor);
    const renamed = autoNameGenericFields(editor, scanned);

    return scanned.map((f) => {
      const wasAutoNamed = renamed.has(f.currentName);
      const name = renamed.get(f.currentName) ?? f.currentName;
      const base: FormFieldModel = {
        name,
        originalName: f.currentName,
        label: labelFromFieldName(name),
        kind: f.kind,
        value: f.value,
        defaultValue: f.value,
        options: f.dropdownItems,
        wasAutoNamed,
        source: 'default',
        valid: true,
        // An auto-named field's business purpose is unknown to the app, so it isn't
        // forced required — the operator can still fill it in, but it won't block Generate.
        required: !wasAutoNamed,
      };
      return { ...base, ...validateField(base) };
    });
  }, []);

  /**
   * Runtime dropdown population (CLAUDE.md §12): for each mapped DropDown field, fetch its
   * options from the mock "backend" (visibly async) and reflect them into the document.
   */
  const populateDropdownOptions = useCallback(
    (targets: FormFieldModel[]) => {
      for (const field of targets) {
        if (field.kind !== 'DropDown') continue;
        const dropdownKey = FIELD_TO_DROPDOWN_KEY[field.name];
        if (!dropdownKey) continue;

        setLoadingDropdowns((prev) => new Set(prev).add(field.name));
        getDropdown(dropdownKey)
          .then((options) => {
            const liveEditor = getEditor();
            if (liveEditor) {
              const info = liveEditor.getFormFieldInfo(field.name) as DropDownFormFieldInfo;
              const current = info?.dropdownItems ?? [];
              const unchanged =
                current.length === options.length && current.every((o, i) => o === options[i]);
              // Only rewrite the field when the option list actually differs — an identical
              // rewrite still fires contentChange, moves the caret, and drops the field's
              // selected index (clobbering a record auto-fill that just landed).
              if (!unchanged) {
                const selected = liveEditor
                  .exportFormData()
                  .find((d) => d.fieldName === field.name)?.value;
                withSyncGuard(() => {
                  liveEditor.setFormFieldInfo(field.name, { ...info, dropdownItems: options });
                  if (typeof selected === 'number' && selected > 0) {
                    liveEditor.importFormData([{ fieldName: field.name, value: selected }]);
                  }
                });
              }
            }
            setFields((prev) => prev.map((f) => (f.name === field.name ? { ...f, options } : f)));
          })
          .finally(() => {
            setLoadingDropdowns((prev) => {
              const next = new Set(prev);
              next.delete(field.name);
              return next;
            });
          });
      }
    },
    [getEditor],
  );

  const scanAndBind = useCallback(() => {
    const editor = getEditor();
    if (!editor) return;
    const initial = buildModels(editor);
    setFields(initial);
    populateDropdownOptions(initial);
  }, [getEditor, buildModels, populateDropdownOptions]);

  /**
   * Re-reads the form-field *list* from the document (fields added/removed/renamed via the
   * editor's Developer tab) and merges it into panel state — keeping each still-present
   * field's operator provenance (`source`) and already-loaded dropdown options, taking the
   * live value from the document. New fields come in fresh; removed fields drop out. Returns
   * overall validity. Nothing here is persisted — it's session-only panel state.
   */
  const rescan = useCallback((): boolean => {
    const editor = getEditor();
    if (!editor) return true;
    // Guard the auto-name renames buildModels performs so their contentChange doesn't loop.
    const fresh = withSyncGuard(() => buildModels(editor));
    const prevByName = new Map(fieldsRef.current.map((f) => [f.name, f]));

    const merged = fresh.map((f) => {
      const prev = prevByName.get(f.name);
      if (!prev) return f;
      const carried: FormFieldModel = {
        ...f,
        source: prev.source,
        options: prev.options?.length ? prev.options : f.options,
      };
      return { ...carried, ...validateField(carried) };
    });

    setFields(merged);
    populateDropdownOptions(merged.filter((f) => !(f.options && f.options.length)));
    return merged.every((f) => f.valid);
  }, [getEditor, buildModels, populateDropdownOptions]);

  const updateFromPanel = useCallback(
    (name: string, rawValue: string) => {
      // Syncfusion's wrapped inputs (e.g. TextBoxComponent) echo their own `change` event
      // when their `value` *prop* is updated programmatically, not just on real user edits —
      // so a db auto-fill's own re-render can otherwise masquerade as 11 separate "user"
      // edits milliseconds later. Ignore panel-originated changes while a guarded doc write
      // is still in flight; the operator can't type into a field that fast anyway.
      if (isSyncingNow()) return;

      const editor = getEditor();
      const target = fieldsRef.current.find((f) => f.name === name);
      if (!editor || !target) return;

      const value: FormFieldData['value'] =
        target.kind === 'CheckBox'
          ? rawValue === 'true'
          : target.kind === 'DropDown'
            ? dropdownIndexFor(target.options, rawValue)
            : rawValue;
      withSyncGuard(() => editor.importFormData([{ fieldName: name, value }]));

      setFields(
        fieldsRef.current.map((f) => {
          if (f.name !== name) return f;
          const updated: FormFieldModel = { ...f, value: rawValue, source: 'user' satisfies FieldSource };
          return { ...updated, ...validateField(updated) };
        }),
      );
    },
    [getEditor],
  );

  const refreshFromDoc = useCallback(() => {
    if (isSyncingNow()) return;
    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      const editor = getEditor();
      if (!editor || isSyncingNow()) return;

      // If the operator added/removed a form field in the editor (Developer tab), the field
      // *list* changed — do a full merge-rescan instead of a values-only refresh.
      const liveNames = editor.getFormFieldNames();
      const known = new Set(fieldsRef.current.map((f) => f.name));
      if (liveNames.length !== known.size || liveNames.some((n) => !known.has(n))) {
        rescan();
        return;
      }

      const exported = new Map(editor.exportFormData().map((d) => [d.fieldName, d.value]));

      setFields((prev) =>
        prev.map((f) => {
          const raw = exported.get(f.name);
          const nextValue =
            f.kind === 'CheckBox'
              ? String(Boolean(raw))
              : f.kind === 'DropDown'
                ? (f.options?.[typeof raw === 'number' ? raw : Number(raw)] ?? '')
                : raw == null
                  ? ''
                  : String(raw);
          if (nextValue === f.value) return f;
          const updated: FormFieldModel = { ...f, value: nextValue, source: 'user' };
          return { ...updated, ...validateField(updated) };
        }),
      );
    }, 150);
  }, [getEditor, rescan]);

  const applyRecordAutoFill = useCallback(
    (record: EmployeeRecord) => {
      const editor = getEditor();
      if (!editor) return;
      const mapped = mapRecordToFields(fieldsRef.current, record);
      if (mapped.size === 0) return;

      const updates: FormFieldData[] = [];
      const next = fieldsRef.current.map((f) => {
        const hit = mapped.get(f.name);
        if (!hit) return f;
        updates.push({ fieldName: f.name, value: hit.wire });
        const updated: FormFieldModel = { ...f, value: hit.label, source: 'db' };
        return { ...updated, ...validateField(updated) };
      });

      withSyncGuard(() => editor.importFormData(updates));
      setFields(next);
    },
    [getEditor],
  );

  const resetForm = useCallback(() => {
    const editor = getEditor();
    if (!editor) return;

    const updates: FormFieldData[] = [];
    const next = fieldsRef.current.map((f) => {
      const value = f.defaultValue;
      const wire: FormFieldData['value'] =
        f.kind === 'CheckBox'
          ? value === 'true'
          : f.kind === 'DropDown'
            ? dropdownIndexFor(f.options, value)
            : value;
      updates.push({ fieldName: f.name, value: wire });
      const cleared: FormFieldModel = { ...f, value, source: 'default' };
      return { ...cleared, ...validateField(cleared) };
    });

    withSyncGuard(() => editor.importFormData(updates));
    setFields(next);
  }, [getEditor]);

  const validateNow = useCallback((): boolean => {
    const validated = fieldsRef.current.map((f) => ({ ...f, ...validateField(f) }));
    setFields(validated);
    return validated.every((f) => f.valid);
  }, []);

  const validateForGenerate = useCallback(
    (docType?: DocType): { blocking: FormFieldModel[]; pendingEmployee: FormFieldModel[] } => {
      const validated = fieldsRef.current.map((f) => ({ ...f, ...validateField(f) }));
      setFields(validated);
      const invalid = validated.filter((f) => !f.valid);
      return {
        blocking: invalid.filter((f) => ownerOf(f.name, docType) === 'hr'),
        pendingEmployee: invalid.filter((f) => ownerOf(f.name, docType) === 'employee'),
      };
    },
    [],
  );

  const isSyncing = useCallback(() => isSyncingNow(), []);

  return {
    fields,
    scanAndBind,
    rescan,
    updateFromPanel,
    refreshFromDoc,
    applyRecordAutoFill,
    resetForm,
    validateNow,
    validateForGenerate,
    isSyncing,
    loadingDropdowns,
  };
}
