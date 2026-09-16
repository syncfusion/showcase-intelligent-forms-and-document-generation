import type { DropdownKey, EmployeeRecord, SessionTemplateRecord, TemplateMeta } from '@/types';
import { dropdownOptions } from './dropdowns';
import { employees } from './employees';
import { predefinedTemplates } from './templates.catalog';

const SESSION_KEY = 'hrdocstudio.templates';

/** Simulated network latency, ms. Randomized so async behavior is visibly "real". */
function latency(min = 300, max = 600): Promise<void> {
  const ms = min + Math.random() * (max - min);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

function readSessionTemplates(): SessionTemplateRecord[] {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SessionTemplateRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSessionTemplates(records: SessionTemplateRecord[]): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(records));
}

/** Fetches the predefined catalog merged with any session-created templates. */
export async function getTemplates(): Promise<TemplateMeta[]> {
  await latency();
  const session: TemplateMeta[] = readSessionTemplates().map((rec) => ({
    id: rec.id,
    title: rec.title,
    description: rec.description,
    accent: rec.accent,
    source: 'session',
    sfdtContent: rec.sfdtContent,
    createdAt: rec.createdAt,
    docType: rec.docType,
  }));
  return [...predefinedTemplates, ...session];
}

/** Persists a new session-only template (sessionStorage — cleared when the tab closes). */
export async function saveSessionTemplate(record: SessionTemplateRecord): Promise<void> {
  await latency(150, 300);
  const existing = readSessionTemplates();
  writeSessionTemplates([...existing, record]);
}

// ---------------------------------------------------------------------------
// Dropdowns
// ---------------------------------------------------------------------------

/** Fetches option lists for a runtime dropdown field, as if from a backend. */
export async function getDropdown(key: DropdownKey): Promise<string[]> {
  await latency();
  return [...dropdownOptions[key]];
}

// ---------------------------------------------------------------------------
// Employees
// ---------------------------------------------------------------------------

/** Fetches employee records, optionally filtered by a free-text query (id/name/dept/email). */
export async function getEmployees(query?: string): Promise<EmployeeRecord[]> {
  await latency();
  if (!query || !query.trim()) return [...employees];
  const q = query.trim().toLowerCase();
  return employees.filter(
    (e) =>
      e.id.toLowerCase().includes(q) ||
      e.fullName.toLowerCase().includes(q) ||
      e.department.toLowerCase().includes(q) ||
      e.designation.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      e.location.toLowerCase().includes(q),
  );
}
