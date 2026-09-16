import JSZip from 'jszip';

const WORD_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

/**
 * Fixes a second Syncfusion `saveAsBlob('Docx')` export defect (see CLAUDE.md §11), distinct
 * from the legacy form-field one in formFieldFix.ts: every table whose cells use percentage
 * widths — `fieldTable()`'s two-column label/value layout sets `preferredWidthType = 'Percent'`
 * (34% / 66%), which serializes as `<w:tcW w:type="pct">` — is exported with the *table's own*
 * width left as `<w:tblW w:type="auto" w:w="0"/>`.
 *
 * Per the OOXML spec, `w:tcW type="pct"` is a percentage of the table's own width, while
 * `w:tblW type="pct"` is a percentage of the page's text width — two different reference frames.
 * `type="auto" w="0"` gives the cells no valid percentage basis at all, so Word can't resolve
 * "34% of ???" and the columns collapse toward zero width — confirmed empirically: this is
 * exactly the letter-by-letter-wrapped table columns reported after the legacy form-field fix
 * cleared the "Word experienced an error" crash and let the file actually open.
 *
 * Fix: for every `<w:tbl>` that contains at least one percent-typed `<w:tcW>`, set its own
 * `<w:tblW>` to `type="pct" w="5000"` (100% of the page's text width — matching how these
 * tables are actually authored: `fieldTable()` never sets a *table*-level width itself, so
 * Syncfusion always sizes the `tblGrid` to the full text width already; this just gives the
 * cells' percentages a valid, matching basis to resolve against). Tables built with only
 * absolute (dxa) cell widths — the letterhead rule bar, `sectionBand()` — are untouched.
 */
export async function fixPercentTableWidths(blob: Blob): Promise<Blob> {
  const zip = await JSZip.loadAsync(blob);
  const parser = new DOMParser();
  const serializer = new XMLSerializer();
  let changedParts = 0;

  const partNames = Object.keys(zip.files).filter((name) => /^word\/.*\.xml$/.test(name));

  for (const name of partNames) {
    const file = zip.files[name];
    const xmlText = await file.async('text');
    if (!xmlText.includes('w:type="pct"')) continue;

    const doc = parser.parseFromString(xmlText, 'application/xml');
    if (doc.getElementsByTagName('parsererror').length > 0) continue; // never touch what didn't parse cleanly

    let modified = false;
    const tables = Array.from(doc.getElementsByTagNameNS(WORD_NS, 'tbl'));
    for (const tbl of tables) {
      const hasPercentCell = Array.from(tbl.getElementsByTagNameNS(WORD_NS, 'tcW')).some(
        (el) => el.getAttributeNS(WORD_NS, 'type') === 'pct',
      );
      if (!hasPercentCell) continue;

      // tblPr is always this table's direct first child per schema — safe even if a (never
      // authored, but defensively handled) nested table appears later in the same subtree.
      const tblPr = tbl.getElementsByTagNameNS(WORD_NS, 'tblPr')[0];
      if (!tblPr) continue;

      let tblW = tblPr.getElementsByTagNameNS(WORD_NS, 'tblW')[0];
      if (tblW && tblW.getAttributeNS(WORD_NS, 'type') === 'pct') continue; // already valid

      if (!tblW) {
        tblW = doc.createElementNS(WORD_NS, 'w:tblW');
        tblPr.insertBefore(tblW, tblPr.firstChild);
      }
      tblW.setAttributeNS(WORD_NS, 'w:type', 'pct');
      tblW.setAttributeNS(WORD_NS, 'w:w', '5000');
      modified = true;
    }
    if (!modified) continue;

    const serialized = serializer.serializeToString(doc);
    const declMatch = /^<\?xml[^?]*\?>/.exec(xmlText);
    const hasDecl = /^<\?xml/.test(serialized);
    zip.file(name, declMatch && !hasDecl ? declMatch[0] + serialized : serialized);
    changedParts++;
  }

  if (changedParts === 0) return blob;
  return zip.generateAsync({ type: 'blob' });
}
