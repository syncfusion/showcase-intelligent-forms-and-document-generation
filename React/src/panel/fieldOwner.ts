/**
 * Field ownership — who is expected to complete a given field. HR persona insight: an HR
 * operator prepares a document and fills the authoritative company/role data, while personal
 * identity, contact, emergency, acknowledgment and signature fields belong to the employee.
 * Making this explicit keeps the app HR-centric while showing which fields are a handoff.
 */
export type FieldOwner = 'hr' | 'employee';
export type DocType = 'letter' | 'form';

/** Fields an HR operator owns (from the HRIS / offer / approval), addressed by exact name. */
const HR_FIELDS = new Set([
  'id',
  'designation',
  'department',
  'manager',
  'employmentType',
  'location',
  'startDate',
  'annualSalary',
  'offerDate',
  'acceptanceDate',
  'orgName',
  'orgAddress',
  'costCenter',
  'approvedBy',
  'approverTitle',
  'approvalDate',
  'approved',
  'companyRepresentative',
  'companyRepresentativeTitle',
  'companySignatureDate',
  'requestDate',
  'neededByDate',
  'coverageEffectiveDate',
  'preparedBy',
  'preparedByTitle',
]);

/** A signing/acceptance field the recipient (employee) completes, even on an HR-authored doc. */
function isSigningField(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    lower.includes('signature') ||
    lower.endsWith('acknowledgment') ||
    lower.endsWith('consent') ||
    name === 'offerAccepted' ||
    name === 'acceptanceDate' ||
    name === 'agreementDate'
  );
}

/**
 * Classifies a field by owner. Letters/agreements are HR-authored: HR fills everything and the
 * employee only signs/accepts, so only signing fields are employee-owned. Forms use the
 * personal-vs-authoritative split (defaults to employee for personal data).
 */
export function ownerOf(name: string, docType?: DocType): FieldOwner {
  if (docType === 'letter') return isSigningField(name) ? 'employee' : 'hr';
  const lower = name.toLowerCase();
  if (HR_FIELDS.has(name)) return 'hr';
  if (lower.endsWith('acknowledgment') || lower.endsWith('consent')) return 'employee';
  if (lower.startsWith('approv') || lower.startsWith('company') || lower.includes('approver') || lower === 'costcenter')
    return 'hr';
  return 'employee';
}

export const OWNER_LABEL: Record<FieldOwner, string> = { hr: 'HR', employee: 'Employee' };
export const OWNER_SECTION: Record<FieldOwner, string> = { hr: 'HR completes', employee: 'Employee completes' };
