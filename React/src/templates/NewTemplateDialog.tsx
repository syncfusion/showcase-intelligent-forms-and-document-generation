import { useState } from 'react';
import { FileText, LayoutList, FilePlus2 } from 'lucide-react';
import type { StarterKind } from './authoring/starters';

interface NewTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (title: string, description: string, starter: StarterKind) => void;
}

const ACCENTS = ['indigo', 'teal', 'amber', 'rose', 'slate', 'sky', 'violet', 'emerald'];

export function pickAccent(seed: string): string {
  const index = Array.from(seed).reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % ACCENTS.length;
  return ACCENTS[index];
}

interface StarterOption {
  kind: StarterKind;
  title: string;
  blurb: string;
  icon: React.ReactNode;
}

const STARTERS: StarterOption[] = [
  { kind: 'letter', title: 'Letter format', blurb: 'Letterhead, date, greeting, body & signature — ready to edit.', icon: <FileText size={22} /> },
  { kind: 'application', title: 'Application form', blurb: 'Letterhead, a section band and a blank field grid to fill in.', icon: <LayoutList size={22} /> },
  { kind: 'blank', title: 'Blank document', blurb: 'Start from an empty page and build it up yourself.', icon: <FilePlus2 size={22} /> },
];

/** Create-new-template dialog: pick a starter, name it, then design it in authoring mode. */
export function NewTemplateDialog({ open, onClose, onCreate }: NewTemplateDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [starter, setStarter] = useState<StarterKind>('letter');

  if (!open) return null;

  const canCreate = title.trim().length > 0;
  const reset = () => {
    setTitle('');
    setDescription('');
    setStarter('letter');
  };

  return (
    <div className="dialog-overlay" role="dialog" aria-modal="true" aria-label="Create a new template">
      <div className="dialog-overlay__scrim" onClick={onClose} />
      <div className="dialog dialog--wide">
        <h2>New Template</h2>
        <p className="dialog__hint">Pick a starting point, name it, then add fields. Saved for this browser session.</p>

        <div className="starter-grid" role="radiogroup" aria-label="Starting point">
          {STARTERS.map((s) => (
            <button
              key={s.kind}
              type="button"
              role="radio"
              aria-checked={starter === s.kind}
              className={`starter-card ${starter === s.kind ? 'starter-card--active' : ''}`}
              onClick={() => setStarter(s.kind)}
            >
              <span className="starter-card__icon">{s.icon}</span>
              <span className="starter-card__title">{s.title}</span>
              <span className="starter-card__blurb">{s.blurb}</span>
            </button>
          ))}
        </div>

        <label className="dialog__field">
          <span>Title</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Referral Bonus Request"
            autoFocus
          />
        </label>

        <label className="dialog__field">
          <span>Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description shown on the gallery card"
            rows={2}
          />
        </label>

        <div className="dialog__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn--primary"
            disabled={!canCreate}
            onClick={() => {
              onCreate(title.trim(), description.trim(), starter);
              reset();
            }}
          >
            Create & design
          </button>
        </div>
      </div>
    </div>
  );
}
