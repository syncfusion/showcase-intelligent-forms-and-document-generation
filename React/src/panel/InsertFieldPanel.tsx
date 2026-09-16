import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { FormFieldKind } from '@/types';
import type { InsertFieldDef } from '@/editor/insertField';
import { INSERT_FIELD_GROUPS } from '@/data/insertFields';

interface InsertFieldPanelProps {
  open: boolean;
  onClose: () => void;
  /** Insert a predefined bound field (label + field) at the editor caret. */
  onInsert: (def: InsertFieldDef) => void;
  /** Insert a custom bound field the author names. */
  onInsertCustom: (label: string, kind: FormFieldKind) => void;
}

/**
 * Authoring-mode right panel — a merge-fields style palette. Clicking a field drops a bound
 * form field (with its label) into the document at the caret; the author can also create a
 * custom field. Mirrors the Syncfusion Document Template Studio merge-field panel.
 */
export function InsertFieldPanel({ open, onClose, onInsert, onInsertCustom }: InsertFieldPanelProps) {
  const [customLabel, setCustomLabel] = useState('');
  const [customKind, setCustomKind] = useState<FormFieldKind>('Text');

  const addCustom = () => {
    const label = customLabel.trim();
    if (!label) return;
    onInsertCustom(label, customKind);
    setCustomLabel('');
    setCustomKind('Text');
  };

  return (
    <>
      <div className={`panel-scrim ${open ? 'panel-scrim--visible' : ''}`} onClick={onClose} aria-hidden={!open} />
      <aside className={`field-panel ${open ? 'field-panel--open' : ''}`} aria-hidden={!open}>
        <header className="field-panel__header">
          <div>
            <h2>Insert Fields</h2>
            <p className="field-panel__subtitle">Click to add a field where the cursor is</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close panel">
            <X size={16} />
          </button>
        </header>

        <div className="field-panel__body">
          {INSERT_FIELD_GROUPS.map((group) => (
            <section key={group.title} className="insert-group">
              <h3 className="insert-group__title">{group.title}</h3>
              <div className="insert-group__chips">
                {group.fields.map((f) => (
                  <button
                    key={f.name}
                    type="button"
                    className="insert-chip"
                    title={`Insert ${f.label} (${f.kind})`}
                    onClick={() => onInsert(f)}
                  >
                    <Plus size={13} />
                    <span>{f.label}</span>
                  </button>
                ))}
              </div>
            </section>
          ))}

          <section className="insert-group insert-group--custom">
            <h3 className="insert-group__title">Custom field</h3>
            <div className="insert-custom">
              <input
                type="text"
                className="insert-custom__input"
                value={customLabel}
                placeholder="Field label, e.g. Cost Center"
                onChange={(e) => setCustomLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addCustom();
                }}
              />
              <select
                className="insert-custom__select"
                value={customKind}
                onChange={(e) => setCustomKind(e.target.value as FormFieldKind)}
                aria-label="Field type"
              >
                <option value="Text">Text</option>
                <option value="CheckBox">Checkbox</option>
                <option value="DropDown">Dropdown</option>
              </select>
              <button type="button" className="btn btn--primary insert-custom__add" disabled={!customLabel.trim()} onClick={addCustom}>
                Add
              </button>
            </div>
            <p className="insert-custom__hint">Custom dropdowns start empty — edit options in the editor’s Developer tab.</p>
          </section>
        </div>
      </aside>
    </>
  );
}
