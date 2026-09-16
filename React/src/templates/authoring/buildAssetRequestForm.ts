import type { DocumentEditor, DropDownFormFieldInfo } from '@syncfusion/ej2-documenteditor';
import { dropdownOptions } from '@/data/dropdowns';
import { createBuilderKit, setDropdownDefaults } from './builderKit';

/**
 * Asset Request Form — IT / facilities equipment issuance request with approval routing,
 * formal company-form layout. Requestor fields auto-fill from a record.
 */
export function buildAssetRequestForm(editor: DocumentEditor): void {
  const { letterhead, note, sectionBand, fieldTable, insertNamedField, footer } = createBuilderKit(editor);
  const dd = (name: string, items: string[]) =>
    insertNamedField<DropDownFormFieldInfo>('DropDown', name, { dropdownItems: items });

  letterhead('Asset Request Form', 'Equipment Issuance Request — IT & Facilities');
  note('Submit at least five business days before the equipment is needed. Requests over $2,500 require director approval.');

  sectionBand('Requestor');
  fieldTable([
    { label: 'Full Name', build: () => insertNamedField('Text', 'fullName') },
    { label: 'Employee ID', build: () => insertNamedField('Text', 'id') },
    { label: 'Department', build: () => dd('department', dropdownOptions.department) },
    { label: 'Reporting Manager', build: () => insertNamedField('Text', 'manager') },
    { label: 'Work Email', build: () => insertNamedField('Text', 'email') },
  ]);

  sectionBand('Request Details');
  fieldTable([
    { label: 'Request Date (MM/DD/YYYY)', build: () => insertNamedField('Text', 'requestDate') },
    { label: 'Date Needed (MM/DD/YYYY)', build: () => insertNamedField('Text', 'neededByDate') },
    { label: 'Asset Type', build: () => dd('assetType', dropdownOptions.assetType) },
    { label: 'Quantity', build: () => insertNamedField('Text', 'quantity') },
    { label: 'Estimated Cost (USD)', build: () => insertNamedField('Text', 'estimatedAmount') },
    { label: 'Business Justification', build: () => insertNamedField('Text', 'businessJustification') },
  ]);

  sectionBand('Delivery');
  fieldTable([
    { label: 'Ship to Location', build: () => dd('location', dropdownOptions.location) },
    { label: 'Delivery Address Line 1', build: () => insertNamedField('Text', 'addressLine1') },
  ]);

  sectionBand('Approval (HR / Manager Use Only)');
  fieldTable([
    { label: 'Approved By', build: () => insertNamedField('Text', 'approvedBy') },
    { label: 'Approver Title', build: () => insertNamedField('Text', 'approverTitle') },
    { label: 'Cost Center', build: () => insertNamedField('Text', 'costCenter') },
    { label: 'Approval Date (MM/DD/YYYY)', build: () => insertNamedField('Text', 'approvalDate') },
    { label: 'Approved for issuance', build: () => insertNamedField('CheckBox', 'approved') },
  ]);

  setDropdownDefaults(editor, ['department', 'assetType', 'location']);
  footer('HR-ASR-01');
}
