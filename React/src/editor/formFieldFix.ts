import JSZip from 'jszip';

/**
 * Reserved Word field-code keywords for legacy form fields. None of this app's authored
 * content ever legitimately contains one of these as a bare, standalone run of text, so any
 * `<w:t>` whose entire content is exactly one of them is unambiguously a serialization defect,
 * never real body text.
 */
const LEGACY_FIELD_CODES = ['FORMTEXT', 'FORMDROPDOWN', 'FORMCHECKBOX'];

const WORD_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

/**
 * Works around a Syncfusion `saveAsBlob('Docx')` defect (confirmed empirically — see CLAUDE.md
 * §11): every legacy form field's code word, which OOXML requires inside `<w:instrText>`
 * between the field's `begin` and `separate` `<w:fldChar>` markers, is instead emitted as a
 * plain `<w:t>` run — ordinary visible body text. Two symptoms follow directly from that one
 * defect:
 *  - lenient readers (Google Docs) print the literal keyword right before the field's value,
 *    e.g. "FORMTEXTOlivia Bennett" / "FORMDROPDOWN" for a blank dropdown;
 *  - strict readers (desktop Microsoft Word) can reject the malformed field structure outright
 *    — this is the "Word experienced an error… open with the Text Recovery Converter" crash,
 *    and it reproduces on every generated DOCX regardless of any other change in this app (the
 *    watermark feature made no difference either way — this sits entirely inside Syncfusion's
 *    own exporter, upstream of anything this codebase writes).
 *
 * Fix: re-parse every `word/*.xml` part with the browser's own DOMParser, retag every `<w:t>`
 * whose *entire* text is exactly one of the three keywords above to `<w:instrText>` (identical
 * text, identical position — nothing added, removed, renumbered, or touched in any other part),
 * and re-serialize with XMLSerializer. Unlike the earlier hand-rolled OOXML watermark hack that
 * corrupted files (see CLAUDE.md §2 "Export watermark"), this never writes XML by hand and never
 * touches relationships/content-types/any other part — it retags one already-valid element type
 * to another inside an already-parsed DOM tree.
 */
export async function fixLegacyFormFieldCodes(blob: Blob): Promise<Blob> {
  const zip = await JSZip.loadAsync(blob);
  const parser = new DOMParser();
  const serializer = new XMLSerializer();
  let changedParts = 0;

  const partNames = Object.keys(zip.files).filter((name) => /^word\/.*\.xml$/.test(name));

  for (const name of partNames) {
    const file = zip.files[name];
    const xmlText = await file.async('text');
    if (!LEGACY_FIELD_CODES.some((code) => xmlText.includes(code))) continue;

    const doc = parser.parseFromString(xmlText, 'application/xml');
    if (doc.getElementsByTagName('parsererror').length > 0) continue; // never touch what didn't parse cleanly

    const textRuns = Array.from(doc.getElementsByTagNameNS(WORD_NS, 't'));
    let modified = false;
    for (const node of textRuns) {
      const content = node.textContent ?? '';
      if (!LEGACY_FIELD_CODES.includes(content.trim())) continue;
      const instr = doc.createElementNS(WORD_NS, 'w:instrText');
      instr.setAttribute('xml:space', 'preserve');
      instr.textContent = content;
      node.parentNode?.replaceChild(instr, node);
      modified = true;
    }
    if (!modified) continue;

    // Some engines' XMLSerializer drops the XML declaration, some keep it — never end up with
    // two (that's an "XML declaration allowed only at the start of the document" parse error).
    const serialized = serializer.serializeToString(doc);
    const declMatch = /^<\?xml[^?]*\?>/.exec(xmlText);
    const hasDecl = /^<\?xml/.test(serialized);
    zip.file(name, declMatch && !hasDecl ? declMatch[0] + serialized : serialized);
    changedParts++;
  }

  if (changedParts === 0) return blob; // nothing to fix — don't pay for a re-zip
  return zip.generateAsync({ type: 'blob' });
}
