import type { InsertFieldDef } from '@/editor/insertField';
import { dropdownOptions } from './dropdowns';

/** A named group of insertable fields shown in the authoring "Insert Fields" palette. */
export interface InsertFieldGroup {
  title: string;
  fields: InsertFieldDef[];
}

/**
 * Predefined fields offered by the authoring palette. Names are aligned to EmployeeRecord keys
 * (and a couple of organization fields) so that, once the template is saved and opened in fill
 * mode, the panel binds/validates them and record auto-fill works with no extra wiring.
 */
export const INSERT_FIELD_GROUPS: InsertFieldGroup[] = [
  {
    title: 'Employee',
    fields: [
      { label: 'Full Name', name: 'fullName', kind: 'Text' },
      { label: 'First Name', name: 'firstName', kind: 'Text' },
      { label: 'Last Name', name: 'lastName', kind: 'Text' },
      { label: 'Employee ID', name: 'id', kind: 'Text' },
      { label: 'Email', name: 'email', kind: 'Text' },
      { label: 'Phone', name: 'phone', kind: 'Text' },
      { label: 'Department', name: 'department', kind: 'DropDown', options: dropdownOptions.department },
      { label: 'Designation', name: 'designation', kind: 'DropDown', options: dropdownOptions.designation },
      { label: 'Reporting Manager', name: 'manager', kind: 'Text' },
      { label: 'Employment Type', name: 'employmentType', kind: 'DropDown', options: dropdownOptions.employmentType },
      { label: 'Start Date', name: 'startDate', kind: 'Text' },
    ],
  },
  {
    title: 'Organization',
    fields: [
      { label: 'Organization Name', name: 'orgName', kind: 'Text' },
      { label: 'Organization Address', name: 'orgAddress', kind: 'Text' },
      { label: 'Work Location', name: 'location', kind: 'DropDown', options: dropdownOptions.location },
    ],
  },
  {
    title: 'Address',
    fields: [
      { label: 'Address Line 1', name: 'addressLine1', kind: 'Text' },
      { label: 'Address Line 2', name: 'addressLine2', kind: 'Text' },
      { label: 'City', name: 'city', kind: 'Text' },
      { label: 'State', name: 'state', kind: 'DropDown', options: dropdownOptions.usState },
      { label: 'ZIP Code', name: 'zip', kind: 'Text' },
    ],
  },
  {
    title: 'Signature',
    fields: [
      { label: 'Signature', name: 'employeeSignature', kind: 'Text' },
      { label: 'Date', name: 'signatureDate', kind: 'Text' },
    ],
  },
];
