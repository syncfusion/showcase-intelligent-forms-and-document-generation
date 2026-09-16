import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

export interface GenerateMenuItem {
  key: string;
  label: string;
  icon: ReactNode;
}

interface GenerateMenuProps {
  /** Primary button label. */
  label: string;
  /** Primary button icon. */
  icon: ReactNode;
  items: GenerateMenuItem[];
  disabled?: boolean;
  busy?: boolean;
  onPrimary: () => void;
  onSelect: (key: string) => void;
}

/**
 * A self-contained split button: the primary click runs the default action, the caret
 * opens a small menu of alternatives. Replaces the Syncfusion SplitButton, whose popup
 * didn't open reliably inside the command bar.
 */
export function GenerateMenu({ label, icon, items, disabled, busy, onPrimary, onSelect }: GenerateMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="gen-menu" ref={wrapRef}>
      <button
        type="button"
        className="gen-menu__primary"
        disabled={disabled || busy}
        onClick={onPrimary}
      >
        {icon}
        <span>{busy ? 'Generating…' : label}</span>
      </button>
      <button
        type="button"
        className="gen-menu__caret"
        disabled={disabled || busy}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="More generate options"
        onClick={() => setOpen((v) => !v)}
      >
        <ChevronDown size={15} />
      </button>

      {open && (
        <ul className="gen-menu__list" role="menu">
          {items.map((it) => (
            <li key={it.key} role="none">
              <button
                type="button"
                role="menuitem"
                className="gen-menu__item"
                onClick={() => {
                  setOpen(false);
                  onSelect(it.key);
                }}
              >
                {it.icon}
                <span>{it.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
