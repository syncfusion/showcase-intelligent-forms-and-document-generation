import type { DocumentEditor } from '@syncfusion/ej2-documenteditor';
import { createBuilderKit } from './builderKit';

/**
 * Mutual Non-Disclosure Agreement, on company letterhead. Signature-block fields (fullName,
 * id, designation, etc.) bind to the panel and auto-fill from a record; clauses are static prose.
 */
export function buildNdaAgreement(editor: DocumentEditor): void {
  const { letterhead, paragraph, note, sectionBand, fieldTable, signatureLine, insertNamedField, footer } =
    createBuilderKit(editor);

  letterhead('Mutual Non-Disclosure Agreement', 'Confidentiality & Invention Assignment');

  paragraph(
    'This Mutual Non-Disclosure Agreement ("Agreement") is entered into between the Company and the ' +
      'undersigned employee or contractor ("Recipient") to protect Confidential Information exchanged ' +
      'in connection with the Recipient’s engagement.',
  );

  sectionBand('1. Confidential Information');
  paragraph(
    'Confidential Information means all non-public business, technical, financial, customer, and ' +
      'personnel information disclosed by either party, in any form, whether or not marked as ' +
      'confidential, together with all notes and derivatives thereof.',
  );

  sectionBand('2. Obligations of the Recipient');
  paragraph(
    'The Recipient shall (a) hold all Confidential Information in strict confidence; (b) use it solely ' +
      'to perform their duties; (c) not disclose it to any third party without prior written consent; ' +
      'and (d) protect it with at least the same care used for its own confidential information.',
  );

  sectionBand('3. Exclusions');
  paragraph(
    'Confidential Information does not include information that is or becomes public through no fault ' +
      'of the Recipient, was lawfully known before disclosure, or is independently developed without ' +
      'use of the disclosing party’s information.',
  );

  sectionBand('4. Intellectual Property');
  paragraph(
    'All work product, inventions, and materials the Recipient creates within the scope of their ' +
      'engagement are the sole property of the Company, and the Recipient assigns all rights therein ' +
      'to the Company.',
  );

  sectionBand('5. Term');
  paragraph(
    'This Agreement applies for the duration of the Recipient’s engagement and for three (3) years ' +
      'thereafter; confidentiality obligations for trade secrets continue for as long as the ' +
      'information remains a trade secret under applicable law.',
  );

  sectionBand('6. Signatures — Recipient');
  fieldTable([
    { label: 'Recipient Name', build: () => insertNamedField('Text', 'fullName') },
    { label: 'Employee ID', build: () => insertNamedField('Text', 'id') },
    { label: 'Title / Role', build: () => insertNamedField('Text', 'designation') },
    { label: 'I have read and agree to the terms of this Agreement', build: () => insertNamedField('CheckBox', 'acknowledgment') },
  ]);
  // Both parties sign and date on paper.
  signatureLine('Recipient Signature');

  sectionBand('Signatures — Company');
  fieldTable([
    { label: 'Company Representative', build: () => insertNamedField('Text', 'companyRepresentative') },
    { label: 'Representative Title', build: () => insertNamedField('Text', 'companyRepresentativeTitle') },
  ]);
  signatureLine('Company Representative Signature');

  note('Governing law: the state in which the Recipient is primarily employed, without regard to conflict-of-law rules.');
  footer('HR-NDA-01');
}
