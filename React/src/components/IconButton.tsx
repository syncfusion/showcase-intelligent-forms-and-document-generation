import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Lucide icon element, e.g. <Eye size={16} />. */
  icon: ReactNode;
  /** Required — used as the tooltip and the accessible name (there's no visible text). */
  label: string;
  /** Optional short text shown next to the icon (kept only where an icon alone is ambiguous). */
  text?: string;
  variant?: 'ghost' | 'primary';
  active?: boolean;
}

/** Compact icon-only (or icon + short text) command button with a tooltip. */
export function IconButton({ icon, label, text, variant = 'ghost', active, className = '', ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`icon-btn icon-btn--${variant} ${active ? 'icon-btn--active' : ''} ${text ? 'icon-btn--with-text' : ''} ${className}`}
      {...rest}
    >
      {icon}
      {text && <span className="icon-btn__text">{text}</span>}
    </button>
  );
}
