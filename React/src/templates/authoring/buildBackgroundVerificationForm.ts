import type { DocumentEditor, DropDownFormFieldInfo } from '@syncfusion/ej2-documenteditor';
import { dropdownOptions } from '@/data/dropdowns';
import { createBuilderKit, setDropdownDefaults } from './builderKit';

/**
 * Background Verification Form — candidate authorization for employment, education, and
 * reference checks, formal company-form layout. Candidate/position fields auto-fill.
 */
export function buildBackgroundVerificationForm(editor: DocumentEditor): void {
  const { letterhead, paragraph, note, sectionBand, fieldTable, signatureLine, insertNamedField, footer } =
    createBuilderKit(editor);
  const dd = (name: string, items: string[]) =>
    insertNamedField<DropDownFormFieldInfo>('DropDown', name, { dropdownItems: items });

  letterhead('Background Verification Authorization', 'Pre-Employment Screening — Confidential');

  paragraph(
    'I authorize the Company and its designated screening provider to obtain and verify information ' +
      'about my employment history, education, professional references, and, where permitted by law, ' +
      'criminal records, for the purpose of evaluating my suitability for employment. Information is ' +
      'used solely for that purpose and handled in accordance with applicable law.',
  );

  sectionBand('Candidate');
  fieldTable([
    { label: 'Full Legal Name', build: () => insertNamedField('Text', 'fullName') },
    { label: 'Candidate / Employee ID', build: () => insertNamedField('Text', 'id') },
    { label: 'Date of Birth (MM/DD/YYYY)', build: () => insertNamedField('Text', 'dateOfBirth') },
    { label: 'Email', build: () => insertNamedField('Text', 'email') },
    { label: 'Phone (XXX) XXX-XXXX', build: () => insertNamedField('Text', 'phone') },
  ]);

  sectionBand('Position Applied For');
  fieldTable([
    { label: 'Job Title', build: () => dd('designation', dropdownOptions.designation) },
    { label: 'Department', build: () => dd('department', dropdownOptions.department) },
    { label: 'Work Location', build: () => dd('location', dropdownOptions.location) },
  ]);

  sectionBand('Checks Authorized');
  fieldTable([
    { label: 'Employment history verification', build: () => insertNamedField('CheckBox', 'employmentVerificationConsent') },
    { label: 'Education verification', build: () => insertNamedField('CheckBox', 'educationVerificationConsent') },
    { label: 'Professional reference checks', build: () => insertNamedField('CheckBox', 'referenceCheckConsent') },
    { label: 'Criminal records check (where permitted by law)', build: () => insertNamedField('CheckBox', 'criminalCheckConsent') },
  ]);

  sectionBand('Reference');
  fieldTable([
    { label: 'Reference Name', build: () => insertNamedField('Text', 'referenceName') },
    { label: 'Relationship', build: () => insertNamedField('Text', 'referenceRelationship') },
    { label: 'Reference Phone (XXX) XXX-XXXX', build: () => insertNamedField('Text', 'referencePhone') },
    { label: 'Reference Email', build: () => insertNamedField('Text', 'referenceEmail') },
  ]);

  sectionBand('Authorization');
  fieldTable([
    { label: 'I have read and authorize the checks selected above', build: () => insertNamedField('CheckBox', 'acknowledgment') },
  ]);
  // The candidate signs and dates on paper.
  signatureLine('Candidate Signature');

  note(
    'A copy of this authorization is as valid as the original. You may request a copy of any report ' +
      'obtained and, where applicable, a summary of your rights under the Fair Credit Reporting Act.',
  );

  setDropdownDefaults(editor, ['designation', 'department', 'location']);
  footer('HR-BGV-01');
}
