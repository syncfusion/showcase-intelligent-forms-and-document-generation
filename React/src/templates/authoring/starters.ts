import type { DocumentEditor } from '@syncfusion/ej2-documenteditor';
import { createBuilderKit } from './builderKit';

/** Starter kinds offered by the New Template dialog. */
export type StarterKind = 'letter' | 'application' | 'blank';

/**
 * Partial "letter format" starter: company letterhead, a date line, greeting, body placeholder,
 * and a signature area. The author fills the body and drops in bound fields via the Insert panel.
 */
export function buildLetterStarter(editor: DocumentEditor): void {
  const { letterhead, paragraph, note, sectionBand, footer } = createBuilderKit(editor);

  letterhead('Company Letter', 'Draft — Human Resources');
  paragraph('Date: ______________________');
  paragraph('Dear [Recipient],');
  paragraph(
    'Write the body of your letter here. Use the Insert Fields panel on the right to drop in ' +
      'bound fields such as Full Name, Department, or Start Date wherever you place the cursor.',
  );
  paragraph('Sincerely,');
  sectionBand('Signature');
  paragraph('______________________________');
  note('Draft letter template — created this session. Add or edit fields, then Save.');
  footer('HR-CUSTOM');
}

/**
 * Partial "application form" starter: company letterhead, one section band, a blank 4-row
 * label/value grid to populate with fields, and a signature block.
 */
export function buildApplicationFormStarter(editor: DocumentEditor): void {
  const { letterhead, note, sectionBand, fieldTable, footer } = createBuilderKit(editor);
  const emptyRows = (n: number) => Array.from({ length: n }, () => ({ label: '', build: () => {} }));

  letterhead('Application Form', 'Draft — Human Resources');
  note('Click a cell, then use the Insert Fields panel on the right to add bound fields. Save when done.');

  sectionBand('Applicant Details');
  fieldTable(emptyRows(4));

  sectionBand('Signature');
  fieldTable(emptyRows(2));

  footer('HR-CUSTOM');
}

/** A truly blank document. */
export function buildBlankStarter(editor: DocumentEditor): void {
  editor.openBlank();
}

export const STARTER_BUILDERS: Record<StarterKind, (editor: DocumentEditor) => void> = {
  letter: buildLetterStarter,
  application: buildApplicationFormStarter,
  blank: buildBlankStarter,
};
