import type {
  CheckBoxFormFieldInfo,
  DocumentEditor,
  DropDownFormFieldInfo,
  FormFieldType,
  TextFormFieldInfo,
} from '@syncfusion/ej2-documenteditor';

/**
 * Shared authoring primitives for every predefined template. Each template is built entirely
 * through the live DocumentEditor's own editing APIs — the only way to produce guaranteed-valid
 * SFDT without a backend DOCX->SFDT conversion step.
 *
 * FORMAL LAYOUT (added): templates now open with a company letterhead, group fields under
 * shaded section bands, and lay label/value pairs into aligned two-column tables so nothing is
 * ragged — i.e. they read as real company paperwork. See letterhead(), sectionBand(),
 * fieldTable(), footer(). The older inline primitives (sectionTitle/fieldRow) are kept for
 * letter prose and single-line date fields.
 */

/** Mock company identity used across all predefined templates (fictional; US-origin). */
export const COMPANY = {
  name: 'Meridian Technologies, Inc.',
  wordmark: '◆ MERIDIAN TECHNOLOGIES, INC.',
  contact:
    '500 Market Street, Suite 1200   ·   San Francisco, CA 94105   ·   (415) 555-0100   ·   people@meridiantech.example',
} as const;

const BRAND = '#1F4E79';
const BAND_BG = '#EAF0F7';
const BAND_TEXT = '#14324F';
const LABEL_BG = '#F5F7FA';
const LABEL_TEXT = '#1A1A1A';
const CONTACT_TEXT = '#6B7280';
const FOOTER_TEXT = '#9AA0A6';

export interface FieldTableRow {
  label: string;
  build: () => void;
}

export interface BuilderKit {
  heading: (text: string) => void;
  subheading: (text: string) => void;
  sectionTitle: (text: string) => void;
  paragraph: (text: string, opts?: { italic?: boolean }) => void;
  note: (text: string) => void;
  insertNamedField: <T extends TextFormFieldInfo | CheckBoxFormFieldInfo | DropDownFormFieldInfo>(
    kind: FormFieldType,
    targetName: string,
    extra?: Partial<T>,
  ) => void;
  insertGenericNamedTextField: () => void;
  fieldRow: (labelText: string, build: () => void) => void;
  blankLine: () => void;
  /** Company letterhead (wordmark + contact + brand rule) followed by the centered doc title. */
  letterhead: (title: string, subtitle?: string) => void;
  /** Full-width shaded section header band. */
  sectionBand: (text: string) => void;
  /** Aligned two-column (label | field) grid — the formal form layout. */
  fieldTable: (rows: FieldTableRow[]) => void;
  /** Static "<who>: ____  Date: ____" rule — a wet-signature area, NOT a bound form field. */
  signatureLine: (who?: string) => void;
  /** Page footer: company + confidentiality + form id + page number. Call last in a builder. */
  footer: (formId: string) => void;
}

export function createBuilderKit(editor: DocumentEditor): BuilderKit {
  const sel = editor.selection;
  const ed = editor.editor;

  const resetBody = () => {
    sel.characterFormat.bold = false;
    sel.characterFormat.italic = false;
    sel.characterFormat.fontSize = 11;
    sel.characterFormat.fontColor = '#000000';
    sel.paragraphFormat.textAlignment = 'Left';
  };

  const heading: BuilderKit['heading'] = (text) => {
    sel.paragraphFormat.textAlignment = 'Center';
    sel.characterFormat.bold = true;
    sel.characterFormat.fontSize = 20;
    ed.insertText(text);
    ed.insertText('\n');
    resetBody();
  };

  const subheading: BuilderKit['subheading'] = (text) => {
    sel.paragraphFormat.textAlignment = 'Center';
    sel.characterFormat.italic = true;
    sel.characterFormat.fontSize = 11;
    ed.insertText(text);
    ed.insertText('\n\n');
    resetBody();
  };

  const sectionTitle: BuilderKit['sectionTitle'] = (text) => {
    sel.characterFormat.bold = true;
    sel.characterFormat.fontSize = 12;
    sel.characterFormat.fontColor = BRAND;
    ed.insertText(text);
    ed.insertText('\n');
    resetBody();
  };

  const paragraph: BuilderKit['paragraph'] = (text, opts) => {
    if (opts?.italic) sel.characterFormat.italic = true;
    ed.insertText(text);
    ed.insertText('\n\n');
    resetBody();
  };

  const note: BuilderKit['note'] = (text) => {
    sel.characterFormat.italic = true;
    sel.characterFormat.fontSize = 9;
    sel.characterFormat.fontColor = CONTACT_TEXT;
    ed.insertText(text);
    ed.insertText('\n\n');
    resetBody();
  };

  const label = (text: string) => {
    sel.characterFormat.bold = true;
    ed.insertText(text);
    sel.characterFormat.bold = false;
  };

  const insertNamedField: BuilderKit['insertNamedField'] = (kind, targetName, extra) => {
    const before = new Set(editor.getFormFieldNames());
    ed.insertFormField(kind);
    const autoName = editor.getFormFieldNames().find((n) => !before.has(n)) ?? '';
    const info = editor.getFormFieldInfo(autoName) as unknown as typeof extra;
    editor.setFormFieldInfo(autoName, { ...info, name: targetName, ...extra } as never);
  };

  const insertGenericNamedTextField: BuilderKit['insertGenericNamedTextField'] = () => {
    ed.insertFormField('Text');
  };

  const fieldRow: BuilderKit['fieldRow'] = (labelText, build) => {
    label(labelText);
    build();
    ed.insertText('\n');
  };

  const blankLine: BuilderKit['blankLine'] = () => {
    ed.insertText('\n');
  };

  // Leave the current table and return to a fresh body paragraph at the document end. The extra
  // paragraph also guarantees a separator between two adjacent tables (Word merges tables that
  // touch with no paragraph between them).
  const exitTableToBody = () => {
    sel.moveToDocumentEnd();
    resetBody();
    ed.insertText('\n');
  };

  const letterhead: BuilderKit['letterhead'] = (title, subtitle) => {
    sel.paragraphFormat.textAlignment = 'Left';
    sel.characterFormat.bold = true;
    sel.characterFormat.fontSize = 16;
    sel.characterFormat.fontColor = BRAND;
    ed.insertText(COMPANY.wordmark);
    ed.insertText('\n');

    sel.characterFormat.bold = false;
    sel.characterFormat.fontSize = 8.5;
    sel.characterFormat.fontColor = CONTACT_TEXT;
    ed.insertText(COMPANY.contact);
    ed.insertText('\n');
    resetBody();

    // Thin brand rule bar (1x1 shaded table with a tiny-font cell).
    ed.insertTable(1, 1);
    sel.cellFormat.background = BRAND;
    sel.characterFormat.fontSize = 2;
    ed.insertText(' ');
    exitTableToBody();

    sel.paragraphFormat.textAlignment = 'Center';
    sel.characterFormat.bold = true;
    sel.characterFormat.fontSize = 18;
    sel.characterFormat.fontColor = BAND_TEXT;
    ed.insertText(title);
    ed.insertText('\n');
    if (subtitle) {
      sel.characterFormat.bold = false;
      sel.characterFormat.italic = true;
      sel.characterFormat.fontSize = 10.5;
      sel.characterFormat.fontColor = CONTACT_TEXT;
      ed.insertText(subtitle);
      ed.insertText('\n');
    }
    resetBody();
    ed.insertText('\n');
  };

  const sectionBand: BuilderKit['sectionBand'] = (text) => {
    ed.insertTable(1, 1);
    sel.cellFormat.background = BAND_BG;
    sel.cellFormat.leftMargin = 6;
    sel.cellFormat.rightMargin = 6;
    sel.characterFormat.bold = true;
    sel.characterFormat.fontSize = 11;
    sel.characterFormat.fontColor = BAND_TEXT;
    ed.insertText(text);
    exitTableToBody();
  };

  const fieldTable: BuilderKit['fieldTable'] = (rows) => {
    const n = rows.length;
    if (n === 0) return;
    ed.insertTable(n, 2);
    for (let i = 0; i < n; i++) {
      // Label cell
      sel.cellFormat.background = LABEL_BG;
      sel.cellFormat.verticalAlignment = 'Center';
      sel.cellFormat.leftMargin = 6;
      sel.cellFormat.rightMargin = 6;
      sel.cellFormat.preferredWidthType = 'Percent';
      sel.cellFormat.preferredWidth = 34;
      sel.characterFormat.bold = true;
      sel.characterFormat.italic = false;
      sel.characterFormat.fontSize = 10;
      sel.characterFormat.fontColor = LABEL_TEXT;
      ed.insertText(rows[i].label);

      sel.handleTabKey(true, false);

      // Value cell — 'empty' (not a hex color) is the WordExport serializer's own sentinel for
      // "no shading" (word-export.js: an unset/'empty' background writes `w:shd fill="auto"`,
      // any other value writes a literal hex fill). An opaque white fill here would otherwise
      // sit in front of the page watermark (a behindDoc-anchored header picture), blocking it on
      // any page dense enough with fieldTable rows to leave little blank space — leaving these
      // cells unshaded lets it show through, same as it already does around the tables.
      sel.cellFormat.background = 'empty';
      sel.cellFormat.verticalAlignment = 'Center';
      sel.cellFormat.leftMargin = 6;
      sel.cellFormat.rightMargin = 6;
      sel.cellFormat.preferredWidthType = 'Percent';
      sel.cellFormat.preferredWidth = 66;
      sel.characterFormat.bold = false;
      sel.characterFormat.italic = false;
      sel.characterFormat.fontSize = 11;
      sel.characterFormat.fontColor = '#000000';
      rows[i].build();

      if (i < n - 1) sel.handleTabKey(true, false);
    }
    exitTableToBody();
  };

  const signatureLine: BuilderKit['signatureLine'] = (who = 'Signature') => {
    resetBody();
    sel.paragraphFormat.textAlignment = 'Left';
    ed.insertText(who + ':  ');
    ed.insertText('_'.repeat(34));
    ed.insertText('      Date:  ');
    ed.insertText('_'.repeat(16));
    ed.insertText('\n\n');
    resetBody();
  };

  const footer: BuilderKit['footer'] = (formId) => {
    sel.goToFooter();
    sel.paragraphFormat.textAlignment = 'Center';
    sel.characterFormat.bold = false;
    sel.characterFormat.italic = false;
    sel.characterFormat.fontSize = 8;
    sel.characterFormat.fontColor = FOOTER_TEXT;
    ed.insertText(
      COMPANY.name + '   ·   Confidential — Internal HR Use Only   ·   Form ' + formId + '   ·   Page ',
    );
    ed.insertField('PAGE', '1');
    sel.closeHeaderFooter();
  };

  editor.openBlank();
  sel.moveToDocumentEnd();

  return {
    heading,
    subheading,
    sectionTitle,
    paragraph,
    note,
    insertNamedField,
    insertGenericNamedTextField,
    fieldRow,
    blankLine,
    letterhead,
    sectionBand,
    fieldTable,
    signatureLine,
    footer,
  };
}

/**
 * Sets each DropDown field's initial selection to its first option (index 0). DropDown
 * FormFieldData is a numeric index into dropdownItems, not the label string, and it isn't set
 * just by supplying dropdownItems at insert time, so without this the field visually shows its
 * first item while exportFormData() reports no value.
 */
export function setDropdownDefaults(editor: DocumentEditor, fieldNames: string[]): void {
  editor.importFormData(fieldNames.map((fieldName) => ({ fieldName, value: 0 })));
}
