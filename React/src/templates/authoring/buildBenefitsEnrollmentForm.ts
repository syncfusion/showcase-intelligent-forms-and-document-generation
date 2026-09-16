import type { DocumentEditor, DropDownFormFieldInfo } from '@syncfusion/ej2-documenteditor';
import { dropdownOptions } from '@/data/dropdowns';
import { createBuilderKit, setDropdownDefaults } from './builderKit';

const byPrefix = (prefix: string) => dropdownOptions.benefitPlan.filter((p) => p.startsWith(prefix));
const COVERAGE_TIERS = ['Employee Only', 'Employee + Spouse', 'Employee + Child(ren)', 'Family'];

/**
 * Benefits Enrollment Form — annual/new-hire elections, formal company-form layout. Employee
 * fields auto-fill from a record; plan lists are authored (filtered slices of the mock catalog).
 */
export function buildBenefitsEnrollmentForm(editor: DocumentEditor): void {
  const { letterhead, note, sectionBand, fieldTable, signatureLine, insertNamedField, footer } = createBuilderKit(editor);
  const dd = (name: string, items: string[]) =>
    insertNamedField<DropDownFormFieldInfo>('DropDown', name, { dropdownItems: items });

  letterhead('Benefits Enrollment Form', 'New Hire / Annual Elections — Total Rewards');
  note(
    'Elections must be submitted within 30 days of your hire date or during Open Enrollment. ' +
      'Coverage is effective on the date shown below once elections are approved.',
  );

  sectionBand('Employee');
  fieldTable([
    { label: 'Full Name', build: () => insertNamedField('Text', 'fullName') },
    { label: 'Employee ID', build: () => insertNamedField('Text', 'id') },
    { label: 'Department', build: () => dd('department', dropdownOptions.department) },
    { label: 'Work Email', build: () => insertNamedField('Text', 'email') },
    { label: 'Hire Date (MM/DD/YYYY)', build: () => insertNamedField('Text', 'startDate') },
    { label: 'Coverage Effective Date (MM/DD/YYYY)', build: () => insertNamedField('Text', 'coverageEffectiveDate') },
  ]);

  sectionBand('Coverage Level');
  fieldTable([{ label: 'Coverage Tier', build: () => dd('coverageTier', COVERAGE_TIERS) }]);

  sectionBand('Plan Elections');
  fieldTable([
    { label: 'Medical Plan', build: () => dd('medicalPlan', byPrefix('Medical')) },
    { label: 'Dental Plan', build: () => dd('dentalPlan', byPrefix('Dental')) },
    { label: 'Vision Plan', build: () => dd('visionPlan', byPrefix('Vision')) },
    { label: 'Life Insurance', build: () => dd('lifeInsurance', byPrefix('Life')) },
    { label: '401(k) Election', build: () => dd('retirementPlan', byPrefix('401')) },
    { label: '401(k) Contribution (% of pay)', build: () => insertNamedField('Text', 'retirementContributionPercent') },
  ]);

  sectionBand('Primary Dependent (if enrolling dependents)');
  fieldTable([
    { label: 'Dependent Name', build: () => insertNamedField('Text', 'dependentName') },
    { label: 'Relationship', build: () => insertNamedField('Text', 'dependentRelationship') },
    { label: 'Dependent Date of Birth (MM/DD/YYYY)', build: () => insertNamedField('Text', 'dependentDateOfBirth') },
  ]);

  sectionBand('Authorization');
  fieldTable([
    { label: 'I authorize the elections above and any related payroll deductions', build: () => insertNamedField('CheckBox', 'acknowledgment') },
  ]);
  // The employee signs and dates on paper.
  signatureLine('Employee Signature');

  setDropdownDefaults(editor, [
    'department',
    'coverageTier',
    'medicalPlan',
    'dentalPlan',
    'visionPlan',
    'lifeInsurance',
    'retirementPlan',
  ]);
  footer('HR-BEN-01');
}
