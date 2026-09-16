import type { DocumentEditor } from '@syncfusion/ej2-documenteditor';
import { createBuilderKit } from './builderKit';

/**
 * Welcome Letter — personalized note sent ahead of the first day, on company letterhead.
 * The greeting carries an inline bound 'fullName' field (auto-fills from a record, editable in
 * the panel, renders the real name live — no leftover «fullName» token). The remaining body
 * prose keeps «designation» / «department» / «manager» / «startDate» / «location» tokens for
 * the mail-merge path; Generate replaces them from the current field values. The letter date
 * is a plain right-aligned line named 'letterDate'.
 */
export function buildWelcomeLetter(editor: DocumentEditor): void {
  const { letterhead, paragraph, note, sectionBand, fieldTable, fieldRow, insertNamedField, footer } =
    createBuilderKit(editor);
  const sel = editor.selection;
  const ed = editor.editor;

  letterhead('Welcome to the Team', 'A Note Ahead of Your First Day');

  // Right-aligned letter date line (plain line, editable as a date control).
  sel.paragraphFormat.textAlignment = 'Right';
  fieldRow('Date: ', () => insertNamedField('Text', 'letterDate'));
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
    'On behalf of everyone here, welcome aboard. We are thrilled that you are joining us as ' +
      '«designation» on the «department» team, reporting to «manager». Your first day is ' +
      '«startDate», and your primary work location will be «location».',
  );
  paragraph(
    'Over the next week you will receive details about your equipment, systems access, benefits ' +
      'enrollment, and your onboarding schedule. Your manager will reach out before your start date ' +
      'to set up your first-week plan and introduce you to the team.',
  );
  paragraph(
    'If anything comes up before then — questions about your start, directions to the office, or ' +
      'help with paperwork — reply to this letter and People Operations will take care of it.',
  );
  paragraph('We are glad you are here, and we are looking forward to working with you.');

  paragraph('Warm regards,');
  sectionBand('Prepared By');
  fieldTable([
    { label: 'Name', build: () => insertNamedField('Text', 'preparedBy') },
    { label: 'Title', build: () => insertNamedField('Text', 'preparedByTitle') },
  ]);

  note('This letter is informational and is not a contract of employment or an offer of employment.');
  footer('HR-WEL-01');
}
