import { X } from 'lucide-react';
import type { FormFieldModel } from '@/types';

interface FieldScanReportProps {
  open: boolean;
  fields: FormFieldModel[];
  onClose: () => void;
  /** Re-runs validation across every field (the report doubles as the validation surface). */
  onRevalidate: () => void;
}

function stateOf(f: FormFieldModel): { label: string; cls: string } {
  if (!f.valid) return { label: 'Invalid', cls: 'scan-state--invalid' };
  if (f.source === 'db') return { label: 'From record', cls: 'scan-state--db' };
  if (f.source === 'user') return { label: 'Edited', cls: 'scan-state--user' };
  return { label: 'Empty', cls: 'scan-state--default' };
}

function displayValue(f: FormFieldModel): string {
  if (f.kind === 'CheckBox') return f.value === 'true' ? 'Checked' : 'Unchecked';
  return f.value || '—';
}

/** Modal report of the template scan — every field, its assigned identifier, type and state.
 * Replaces the old "Validate" button: opens automatically once per template and on demand. */
export function FieldScanReport({ open, fields, onClose, onRevalidate }: FieldScanReportProps) {
  if (!open) return null;

  const autoNamed = fields.filter((f) => f.wasAutoNamed).length;
  const invalid = fields.filter((f) => !f.valid).length;

  return (
    <div className="scan-overlay" role="dialog" aria-modal="true" aria-label="Field scan report">
      <div className="scan-overlay__scrim" onClick={onClose} />
      <div className="scan-overlay__panel">
        <header className="scan-overlay__header">
          <div>
            <p className="scan-overlay__eyebrow">Template scan</p>
            <h2>
              {fields.length} form field{fields.length === 1 ? '' : 's'} detected
              {autoNamed > 0 && ` · ${autoNamed} auto-identified`}
              {invalid > 0 && ` · ${invalid} need attention`}
            </h2>
            <p className="scan-overlay__sub">
              Enumerated straight from the document with <code>getFormFieldNames</code>. Fields with no
              usable name were given a stable identifier after a uniqueness check.
            </p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </header>

        <div className="scan-overlay__body">
          <table className="scan-table">
            <thead>
              <tr>
                <th>Name in template</th>
                <th>Assigned ID</th>
                <th>Type</th>
                <th>Required</th>
                <th>State</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((f) => {
                const state = stateOf(f);
                return (
                  <tr key={f.name} className={f.wasAutoNamed ? 'scan-row--auto' : ''}>
                    <td>
                      <code>{f.originalName}</code>
                      {f.wasAutoNamed && <span className="scan-badge">unnamed</span>}
                    </td>
                    <td>
                      <code>{f.name}</code>
                    </td>
                    <td>{f.kind}</td>
                    <td>{f.required ? 'Yes' : 'No'}</td>
                    <td>
                      <span className={`scan-state ${state.cls}`}>{state.label}</span>
                    </td>
                    <td className="scan-table__value">{displayValue(f)}</td>
                  </tr>
                );
              })}
              {fields.length === 0 && (
                <tr>
                  <td colSpan={6} className="scan-table__empty">
                    No form fields detected in this document.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="scan-overlay__footer">
          <span className="scan-overlay__footnote">
            Fields you add or remove in the editor (Developer&nbsp;▸&nbsp;Form&nbsp;Fields) sync to
            this panel automatically; use Rescan if one doesn&rsquo;t appear.
          </span>
          <div className="scan-overlay__actions">
            <button type="button" className="btn btn--ghost btn--sm" onClick={onRevalidate}>
              Rescan &amp; re-validate
            </button>
            <button type="button" className="btn btn--primary btn--sm" onClick={onClose}>
              Continue
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
