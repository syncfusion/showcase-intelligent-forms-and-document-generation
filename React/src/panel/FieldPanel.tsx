import { X } from 'lucide-react';
import type { FormFieldModel } from '@/types';
import { FieldControl } from './FieldControl';
import { PanelProgress } from './PanelProgress';
import { computeProgress } from './progress';
import { ownerOf, OWNER_SECTION, type FieldOwner, type DocType } from './fieldOwner';

interface FieldPanelProps {
  fields: FormFieldModel[];
  onChange: (name: string, rawValue: string) => void;
  open: boolean;
  onClose: () => void;
  loadingDropdowns: Set<string>;
  /** Document nature — letters are HR-authored, forms split HR/employee. */
  docType?: DocType;
}

/** Elevated, glass, slide-in panel — the field-binding surface for the current template. */
export function FieldPanel({ fields, onChange, open, onClose, loadingDropdowns, docType }: FieldPanelProps) {
  const invalidCount = fields.filter((f) => !f.valid).length;
  const dbCount = fields.filter((f) => f.source === 'db').length;
  const progress = computeProgress(fields);

  const groups: FieldOwner[] = ['hr', 'employee'];
  const byOwner = (owner: FieldOwner) => fields.filter((f) => ownerOf(f.name, docType) === owner);

  const renderField = (field: FormFieldModel) => (
    <FieldControl
      key={field.name}
      field={field}
      onChange={onChange}
      optionsLoading={loadingDropdowns.has(field.name)}
      owner={ownerOf(field.name, docType)}
    />
  );

  return (
    <>
      <div className={`panel-scrim ${open ? 'panel-scrim--visible' : ''}`} onClick={onClose} aria-hidden={!open} />
      <aside className={`field-panel ${open ? 'field-panel--open' : ''}`} aria-hidden={!open}>
        <header className="field-panel__header">
          <div>
            <h2>Fields</h2>
            <p className="field-panel__subtitle">
              {fields.length} field{fields.length === 1 ? '' : 's'}
              {dbCount > 0 && ` · ${dbCount} from record`}
              {invalidCount > 0 && ` · ${invalidCount} need attention`}
            </p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close panel">
            <X size={16} />
          </button>
        </header>

        {fields.length > 0 && <PanelProgress progress={progress} />}

        <div className="field-panel__body">
          {fields.length === 0 && <p className="field-panel__empty">No form fields detected in this document.</p>}
          {groups.map((owner) => {
            const groupFields = byOwner(owner);
            if (groupFields.length === 0) return null;
            return (
              <section key={owner} className="field-group">
                <div className="field-group__head">
                  <span className={`chip chip--owner-${owner}`}>{owner === 'hr' ? 'HR' : 'Employee'}</span>
                  <span>{OWNER_SECTION[owner]}</span>
                  <span className="field-group__count">{groupFields.length}</span>
                </div>
                {groupFields.map(renderField)}
              </section>
            );
          })}
        </div>
      </aside>
    </>
  );
}
