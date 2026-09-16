import type { DocumentEditor, DropDownFormFieldInfo } from '@syncfusion/ej2-documenteditor';
import { dropdownOptions } from '@/data/dropdowns';
import { createBuilderKit, setDropdownDefaults } from './builderKit';

/**
 * Employee Information Sheet — single-page master HR record, formal company-form layout.
 * Every field maps 1:1 to an EmployeeRecord key, so selecting a record fills the whole sheet.
 */
export function buildEmployeeInformationSheet(editor: DocumentEditor): void {
  const { letterhead, note, sectionBand, fieldTable, insertNamedField, footer } = createBuilderKit(editor);
  const dd = (name: string, items: string[]) =>
    insertNamedField<DropDownFormFieldInfo>('DropDown', name, { dropdownItems: items });

  letterhead('Employee Information Sheet', 'Core HR Record — Confidential');
  note('Master reference record maintained by Human Resources. Verify against the HRIS on each update.');

  sectionBand('Identification');
  fieldTable([
    { label: 'Full Legal Name', build: () => insertNamedField('Text', 'fullName') },
    { label: 'First Name', build: () => insertNamedField('Text', 'firstName') },
    { label: 'Last Name', build: () => insertNamedField('Text', 'lastName') },
    { label: 'Employee ID', build: () => insertNamedField('Text', 'id') },
  ]);

  sectionBand('Position');
  fieldTable([
    { label: 'Job Title', build: () => dd('designation', dropdownOptions.designation) },
    { label: 'Department', build: () => dd('department', dropdownOptions.department) },
    { label: 'Reporting Manager', build: () => insertNamedField('Text', 'manager') },
    { label: 'Employment Type', build: () => dd('employmentType', dropdownOptions.employmentType) },
    { label: 'Primary Work Location', build: () => dd('location', dropdownOptions.location) },
    { label: 'Start Date (MM/DD/YYYY)', build: () => insertNamedField('Text', 'startDate') },
  ]);

  sectionBand('Contact');
  fieldTable([
    { label: 'Work Email', build: () => insertNamedField('Text', 'email') },
    { label: 'Phone (XXX) XXX-XXXX', build: () => insertNamedField('Text', 'phone') },
  ]);

  sectionBand('Home Address');
  fieldTable([
    { label: 'Address Line 1', build: () => insertNamedField('Text', 'addressLine1') },
    { label: 'Address Line 2 (optional)', build: () => insertNamedField('Text', 'addressLine2') },
    { label: 'City', build: () => insertNamedField('Text', 'city') },
    { label: 'State (2-letter, e.g. CA)', build: () => insertNamedField('Text', 'state') },
    { label: 'ZIP Code', build: () => insertNamedField('Text', 'zip') },
  ]);

  setDropdownDefaults(editor, ['designation', 'department', 'employmentType', 'location']);
  footer('HR-EIS-01');
}
