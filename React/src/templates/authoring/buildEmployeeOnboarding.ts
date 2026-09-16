import type { DocumentEditor, DropDownFormFieldInfo } from '@syncfusion/ej2-documenteditor';
import { dropdownOptions } from '@/data/dropdowns';
import { createBuilderKit, setDropdownDefaults } from './builderKit';

/**
 * Employee Onboarding Form — new-hire intake packet, laid out as a formal company form
 * (letterhead, shaded section bands, aligned label/value tables, footer). Every field whose
 * name matches an EmployeeRecord key auto-fills from a selected record. This form is purely
 * form-field driven — classic token-based mail merge is demonstrated in the letter templates.
 */
export function buildEmployeeOnboarding(editor: DocumentEditor): void {
  const { letterhead, note, sectionBand, fieldTable, signatureLine, insertNamedField, footer } =
    createBuilderKit(editor);
  const dd = (name: string, items: string[]) =>
    insertNamedField<DropDownFormFieldInfo>('DropDown', name, { dropdownItems: items });

  letterhead('Employee Onboarding Form', 'New Hire Intake — People Operations');
  note(
    'To be completed jointly by People Operations and the incoming employee on or before the first day. ' +
      'All fields except those marked optional are required.',
  );

  sectionBand('1. Personal Information');
  fieldTable([
    { label: 'Full Legal Name', build: () => insertNamedField('Text', 'fullName') },
    { label: 'First Name', build: () => insertNamedField('Text', 'firstName') },
    { label: 'Last Name', build: () => insertNamedField('Text', 'lastName') },
    { label: 'Employee ID', build: () => insertNamedField('Text', 'id') },
    { label: 'Date of Birth (MM/DD/YYYY)', build: () => insertNamedField('Text', 'dateOfBirth') },
    { label: 'Personal Email', build: () => insertNamedField('Text', 'email') },
    { label: 'Mobile Phone (XXX) XXX-XXXX', build: () => insertNamedField('Text', 'phone') },
  ]);

  sectionBand('2. Position & Assignment');
  fieldTable([
    { label: 'Job Title', build: () => dd('designation', dropdownOptions.designation) },
    { label: 'Department', build: () => dd('department', dropdownOptions.department) },
    { label: 'Reporting Manager', build: () => insertNamedField('Text', 'manager') },
    { label: 'Employment Type', build: () => dd('employmentType', dropdownOptions.employmentType) },
    { label: 'Start Date (MM/DD/YYYY)', build: () => insertNamedField('Text', 'startDate') },
    { label: 'Annual Base Salary (USD)', build: () => insertNamedField('Text', 'annualSalary') },
  ]);

  sectionBand('3. Work Location & Home Address');
  fieldTable([
    { label: 'Primary Work Location', build: () => dd('location', dropdownOptions.location) },
    { label: 'Address Line 1', build: () => insertNamedField('Text', 'addressLine1') },
    { label: 'Address Line 2 (optional)', build: () => insertNamedField('Text', 'addressLine2') },
    { label: 'City', build: () => insertNamedField('Text', 'city') },
    { label: 'State (2-letter, e.g. CA)', build: () => insertNamedField('Text', 'state') },
    { label: 'ZIP Code', build: () => insertNamedField('Text', 'zip') },
  ]);

  sectionBand('4. Emergency Contact');
  fieldTable([
    { label: 'Contact Name', build: () => insertNamedField('Text', 'emergencyContactName') },
    { label: 'Relationship', build: () => insertNamedField('Text', 'emergencyContactRelationship') },
    { label: 'Contact Phone (XXX) XXX-XXXX', build: () => insertNamedField('Text', 'emergencyContactPhone') },
  ]);

  sectionBand('5. Policy Acknowledgments');
  fieldTable([
    { label: 'I have received and reviewed the Employee Handbook', build: () => insertNamedField('CheckBox', 'handbookAcknowledgment') },
    { label: 'I agree to the Code of Conduct and Anti-Harassment Policy', build: () => insertNamedField('CheckBox', 'codeOfConductAcknowledgment') },
    { label: 'I consent to the Data Privacy and Acceptable Use Policy', build: () => insertNamedField('CheckBox', 'dataPrivacyAcknowledgment') },
  ]);

  // The employee signs and dates this on paper — a plain rule, not bound form fields.
  sectionBand('6. Signature');
  signatureLine('Employee Signature');

  setDropdownDefaults(editor, ['designation', 'department', 'employmentType', 'location']);
  footer('HR-ONB-01');
}
