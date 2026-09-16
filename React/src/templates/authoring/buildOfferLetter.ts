import type { DocumentEditor, DropDownFormFieldInfo } from '@syncfusion/ej2-documenteditor';
import { dropdownOptions } from '@/data/dropdowns';
import { createBuilderKit, setDropdownDefaults } from './builderKit';

/**
 * Offer Letter — formal offer of employment on company letterhead. The greeting carries an
 * inline bound 'fullName' field (auto-fills, editable, renders the real name live). The body
 * keeps «designation» / «department» / «manager» / «startDate» tokens, filled from the
 * Position Details fields on Generate. The offer date is a plain right-aligned line.
 */
export function buildOfferLetter(editor: DocumentEditor): void {
  const { letterhead, paragraph, note, sectionBand, fieldTable, fieldRow, signatureLine, insertNamedField, footer } =
    createBuilderKit(editor);
  const sel = editor.selection;
  const ed = editor.editor;
  const dd = (name: string, items: string[]) =>
    insertNamedField<DropDownFormFieldInfo>('DropDown', name, { dropdownItems: items });

  letterhead('Offer of Employment', 'Private & Confidential');

  // Right-aligned offer date line (plain line, editable as a date control).
  sel.paragraphFormat.textAlignment = 'Right';
  fieldRow('Date: ', () => insertNamedField('Text', 'offerDate'));
  sel.paragraphFormat.textAlignment = 'Left';
  ed.insertText('\n');

  // Greeting: "Dear <bound fullName field>," — one recipient reference, editable + auto-filled.
  sel.characterFormat.bold = false;
  sel.characterFormat.italic = false;
  sel.characterFormat.fontSize = 11;
  sel.characterFormat.fontColor = '#000000';
  ed.insertText('Dear ');
  insertNamedField('Text', 'fullName');
  ed.insertText(',\n\n');

  paragraph(
    'We are pleased to offer you the position of «designation» on the «department» team, ' +
      'reporting to «manager». We were impressed by your background and believe you will make a ' +
      'strong contribution. The terms of this offer are set out below.',
  );

  sectionBand('Position Details');
  fieldTable([
    { label: 'Job Title', build: () => dd('designation', dropdownOptions.designation) },
    { label: 'Department', build: () => dd('department', dropdownOptions.department) },
    { label: 'Employment Type', build: () => dd('employmentType', dropdownOptions.employmentType) },
    { label: 'Primary Work Location', build: () => dd('location', dropdownOptions.location) },
    { label: 'Start Date (MM/DD/YYYY)', build: () => insertNamedField('Text', 'startDate') },
    { label: 'Annual Base Salary (USD)', build: () => insertNamedField('Text', 'annualSalary') },
    { label: 'Reporting Manager', build: () => insertNamedField('Text', 'manager') },
  ]);

  sectionBand('Conditions');
  paragraph(
    'This offer is contingent on your eligibility to work in the United States, satisfactory ' +
      'completion of a background verification, and your agreement to the Company’s ' +
      'Confidentiality and Invention Assignment Agreement. Employment is on an at-will basis.',
  );
  paragraph(
    'To accept, please sign below and return this letter by «startDate». This offer expires if not ' +
      'accepted by that date.',
  );

  sectionBand('Acceptance');
  fieldTable([
    { label: 'I accept this offer on the terms stated above', build: () => insertNamedField('CheckBox', 'offerAccepted') },
  ]);
  // The candidate prints their name, signs, and dates their acceptance on paper.
  signatureLine('Employee Signature');

  note('This letter contains the entire offer and supersedes any prior discussions, written or oral.');

  setDropdownDefaults(editor, ['designation', 'department', 'employmentType', 'location']);
  footer('HR-OFR-01');
}
