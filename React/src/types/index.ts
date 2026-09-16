/**
 * Core domain types for HR Doc Studio.
 * All region formatting (dates, phone, address, currency) targets en-US.
 */

/** Native Syncfusion Document Editor form-field types we support. */
export type FormFieldKind = 'Text' | 'CheckBox' | 'DropDown';

/** Where a field's current value came from. Drives visual state (§10 in CLAUDE.md). */
export type FieldSource = 'db' | 'user' | 'default';

/** What the operator asked Generate to produce. */
export type ExportFormat = 'docx' | 'pdf' | 'both';

/** One scanned/bound form field, mirrored between the document and the side panel. */
export interface FormFieldModel {
  /** Stable, unique field name as it exists in the document (post auto-naming). */
  name: string;
  /** The field's name as it was found in the template, before any auto-identifier was assigned. */
  originalName: string;
  /** Human-readable label shown in the panel, derived from the name. */
  label: string;
  /** Syncfusion form-field type. */
  kind: FormFieldKind;
  /** Current value (string for Text/DropDown, boolean-as-string 'true'/'false' for CheckBox). */
  value: string;
  /** The document's own default/placeholder value at scan time. */
  defaultValue: string;
  /** Options for DropDown fields, loaded async from the mock API. */
  options?: string[];
  /** True if this field's name was blank/duplicate and got an auto-assigned identifier. */
  wasAutoNamed: boolean;
  /** Provenance of the current value — drives .field--db / .field--user styling. */
  source: FieldSource;
  /** Whether the field currently passes validation. */
  valid: boolean;
  /** Validation message to show when invalid. */
  validationMessage?: string;
  /** Whether the field is required for generation. */
  required: boolean;
}

/** A record from the mock "backend" used to auto-fill a document (US-region fields). */
export interface EmployeeRecord {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  designation: string;
  manager: string;
  location: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  /** Two-letter USPS state abbreviation, e.g. "CA". */
  state: string;
  /** US ZIP or ZIP+4, e.g. "94105" or "94105-1234". */
  zip: string;
  /** ISO date (yyyy-MM-dd) internally; always *displayed* as MM/DD/YYYY. */
  startDate: string;
  /** US phone format: (XXX) XXX-XXXX */
  phone: string;
  employmentType: string;
  annualSalary: number;
}

/** Keys the mock dropdown service knows how to resolve. */
export type DropdownKey =
  | 'department'
  | 'designation'
  | 'location'
  | 'employmentType'
  | 'assetType'
  | 'benefitPlan'
  | 'usState';

export type TemplateSource = 'predefined' | 'session';

export interface TemplateMeta {
  id: string;
  title: string;
  description: string;
  /** Short accent used on the gallery card (CSS color token name, not a literal color). */
  accent: string;
  source: TemplateSource;
  /** Key into PREDEFINED_BUILDERS — predefined templates are built at runtime from source. */
  builderId?: string;
  /** Public path for predefined templates, e.g. "/templates/employee-onboarding.sfdt" (legacy fallback). */
  sfdtPath?: string;
  /** Gallery card banner image (public path). Predefined templates only; session templates fall back to the accent band. */
  image?: string;
  /** Transient (not persisted): starter kind used while a new template is being authored. */
  starter?: 'letter' | 'application' | 'blank';
  /** Document nature — drives field ownership (letters are HR-authored; forms split HR/employee). */
  docType?: 'letter' | 'form';
  /** Inline SFDT JSON string for session-created templates (sessionStorage-backed). */
  sfdtContent?: string;
  createdAt?: string;
}

/** Shape persisted to sessionStorage under `hrdocstudio.templates`. */
export interface SessionTemplateRecord {
  id: string;
  title: string;
  description: string;
  accent: string;
  sfdtContent: string;
  createdAt: string;
  docType?: 'letter' | 'form';
}
