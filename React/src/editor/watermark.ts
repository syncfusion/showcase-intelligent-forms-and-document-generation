import type { DocumentEditor } from '@syncfusion/ej2-documenteditor';
import JSZip from 'jszip';

/**
 * Export-only watermark: the Syncfusion Essential Studio Enterprise Edition stamp, placed in the
 * bottom-right corner of every page. Applied while exporting DOCX and PDF only — never left in
 * the editor. Vite rewrites `import.meta.env.BASE_URL` to the configured `base` at build time
 * (see vite.config.ts) — same base-prefixing `templates.catalog.ts` does for gallery cover
 * images, so this keeps resolving correctly under a non-root deployment path.
 */
const WATERMARK_URL = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/gallery/syncfusion-essential-studio-enterprise-edition.jpg`;

/** US Letter page size in points (8.5in × 11in × 72pt/in) — every predefined template uses the
 * DocumentEditor's default page size (createBuilderKit() only ever calls openBlank()). */
const PAGE_WIDTH_PT = 612;
const PAGE_HEIGHT_PT = 792;
/** Watermark width as a fraction of page width; height follows the image aspect ratio. Shared by
 * both export paths so the DOCX and PDF watermarks read as the same size. Originally 0.5 (a
 * large, page-centered mark); scaled to 30% of that per request — a small corner mark instead. */
const PAGE_WIDTH_FRACTION = 0.5 * 0.3;
/** Inset from the page's physical edge for the bottom-right corner placement — points. */
const CORNER_MARGIN_PT = 18;
/** Faint enough to sit behind content without obscuring it (PDF path — true alpha transparency
 * via PdfGraphics, no OOXML approximation needed there). */
const PDF_OPACITY = 0.18;

export interface WatermarkAsset {
  /** JPEG data URI. PdfBitmap (ej2-pdf-export) supports JPEG only, so we keep JPEG throughout. */
  dataUri: string;
  /** JPEG base64 without the data-URI prefix. */
  base64: string;
  width: number;
  height: number;
}

let cache: Promise<WatermarkAsset> | null = null;

/**
 * Re-encodes a decoded image through a canvas as a plain RGB/YCbCr JPEG, whatever the source
 * file's actual color mode. Needed because `@syncfusion/ej2-pdf-export`'s JPEG decoder
 * (`ImageDecoder.getColorSpace()`) unconditionally declares every JPEG it embeds as `DeviceRGB`
 * — it never inspects the file's real component count. A single-channel *grayscale* JPEG (which
 * the current watermark asset is) still gets tagged DeviceRGB, so the PDF's image data and its
 * declared colorspace disagree; readers than misinterpret the byte stream (every 3 grayscale
 * bytes read as one RGB pixel), which is exactly the tripled/offset/garbled watermark reported —
 * the DOCX path is unaffected since Word decodes the JPEG itself, colorspace-agnostic. A canvas
 * always encodes 3-component JPEGs regardless of the source, so this guarantees a file
 * ej2-pdf-export's decoder interprets correctly, independent of whatever the source asset is.
 */
function toRgbJpegDataUri(img: HTMLImageElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable for watermark re-encoding');
  // JPEG has no alpha channel; paint white first so any non-opaque source pixels don't default
  // to the canvas's transparent-black.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.92);
}

/** Loads the watermark image once, decodes it, and normalizes it to RGB (cached for the
 * session) — see toRgbJpegDataUri() for why the normalization step is necessary. */
export function getWatermark(): Promise<WatermarkAsset> {
  if (cache) return cache;
  cache = (async () => {
    const resp = await fetch(WATERMARK_URL);
    if (!resp.ok) throw new Error(`Watermark asset request failed: ${resp.status}`);
    const buf = new Uint8Array(await resp.arrayBuffer());
    let binary = '';
    for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
    const sourceDataUri = `data:image/jpeg;base64,${btoa(binary)}`;
    const sourceImg = new Image();
    sourceImg.src = sourceDataUri;
    await sourceImg.decode();

    const dataUri = toRgbJpegDataUri(sourceImg);
    const base64 = dataUri.slice(dataUri.indexOf(',') + 1);
    return { dataUri, base64, width: sourceImg.naturalWidth, height: sourceImg.naturalHeight };
  })();
  // Never cache a rejection — a transient fetch/decode failure shouldn't permanently break
  // every later export attempt in this session.
  cache.catch(() => {
    cache = null;
  });
  return cache;
}

// --- PDF ---------------------------------------------------------------------

/** Draws the watermark small, semi-transparent, and inset from the bottom-right corner of a
 * single PdfPage. */
export function drawPdfWatermark(
  page: { graphics: PdfGraphicsLike },
  pageWidthPt: number,
  pageHeightPt: number,
  bitmap: unknown,
  asset: WatermarkAsset,
): void {
  const w = pageWidthPt * PAGE_WIDTH_FRACTION;
  const h = w * (asset.height / asset.width);
  const x = pageWidthPt - w - CORNER_MARGIN_PT;
  const y = pageHeightPt - h - CORNER_MARGIN_PT;
  const g = page.graphics;
  g.save();
  g.setTransparency(PDF_OPACITY);
  g.drawImage(bitmap, x, y, w, h);
  g.restore();
}

interface PdfGraphicsLike {
  save(): unknown;
  restore(): void;
  setTransparency(alpha: number): void;
  drawImage(image: unknown, x: number, y: number, width: number, height: number): void;
}

// --- DOCX --------------------------------------------------------------------
//
// A prior version of this stamped the watermark into the exported DOCX by hand-editing its
// OOXML zip package by splicing raw, ad hoc XML strings — new header part, patched
// [Content_Types].xml, patched relationship files, all typed by hand. That produced files Word
// could not open ("Word experienced an error… open with the Text Recovery Converter") — a
// corrupt DOCX is worse than no watermark, and "downloads a real, editable .docx" is the one
// non-negotiable requirement here (CLAUDE.md §12).
//
// This version keeps that lesson: step 1 (below) only ever calls the DocumentEditor's own
// supported editing APIs to get *an* image into the header, exactly like every other piece of
// content in these templates — so saveAsBlob('Docx') keeps producing a file Syncfusion's own
// serializer guarantees is well-formed. The DocumentEditor's public API stops there, though —
// it has no picture text-wrapping / position / transparency setters (`SelectionImageFormat` only
// has width/height/alternateText), so it can only place a plain inline image, not a true
// centered, behind-text, washed-out watermark.
//
// Step 2 (applyDocxWatermarkEffect, run post-export in exporters.ts's sanitizeDocxBlob(), the
// same pipeline as formFieldFix.ts / tableWidthFix.ts) closes that gap safely: it locates the
// one `<w:drawing>` Syncfusion just created for this image (found by the distinctive alt-text
// marker `insertImageAsync` was given below, not by position/index), reuses only its already-
// valid relationship id and size (`r:embed`, `cx`/`cy` — read off the existing node, never
// invented), and replaces *only that element* with a self-authored, fully static replacement
// built from a known-correct template (parsed and imported via DOMParser, never string-spliced
// into the live document) — a `<wp:anchor>` inset from the page's bottom-right corner,
// `behindDoc="1"`, with the same `<a:lum bright="70000" contrast="-70000"/>` "Washout" recolor
// real Word's own Picture Watermark feature applies. Nothing else in the document — no
// relationships, no content types, no other part — is touched.

/** Intended watermark width, points — same PAGE_WIDTH_FRACTION the PDF path uses, so the two
 * exports read as the same size. */
const DOCX_WATERMARK_WIDTH_PT = PAGE_WIDTH_PT * PAGE_WIDTH_FRACTION;
/** `editor.editor.insertImageAsync`'s width/height are CSS pixels at 96dpi (confirmed
 * empirically — the DocumentEditor works in that unit throughout, same as exportAsImage's
 * PT_PER_PX in exporters.ts), not points, despite every other size in this app being authored in
 * points. Converting here keeps the *exported* watermark at the intended point size instead of
 * coming out ~25% smaller. */
const PX_PER_PT = 96 / 72;

/** Alt text on the inserted image — doubles as the marker applyDocxWatermarkEffect() searches
 * for, since it's never legitimately used as alt text on any other image in this app. */
const WATERMARK_MARKER = 'Syncfusion Essential Studio Watermark';

/**
 * Inserts the watermark image into the document header using only supported editor APIs (its
 * final placement/appearance is fixed up post-export — see applyDocxWatermarkEffect below), and
 * returns a `restore()` that puts the document back exactly as it was. Call `restore()` in a
 * `finally` right after exporting — the watermark must never be left in the live, editable
 * document.
 */
export async function applyDocxHeaderWatermark(
  editor: DocumentEditor,
  asset: WatermarkAsset,
): Promise<{ restore: () => void }> {
  const pristine = editor.serialize();
  const formData = editor.exportFormData();

  const widthPx = DOCX_WATERMARK_WIDTH_PT * PX_PER_PT;
  const heightPx = widthPx * (asset.height / asset.width);

  editor.selection.goToHeader();
  // The async variant resolves once the image is actually inserted into the document model —
  // the plain sync insertImage() doesn't guarantee that before the very next statement runs.
  await editor.editor.insertImageAsync(asset.dataUri, widthPx, heightPx, WATERMARK_MARKER);
  editor.selection.closeHeaderFooter();

  return {
    restore: () => {
      editor.open(pristine);
      // A same-tick importFormData right after open() doesn't reliably stick for DropDown
      // fields (their widget/layout setup isn't done synchronously) — defer one tick, same
      // fix used everywhere else in this codebase that reopens a pristine snapshot.
      window.setTimeout(() => editor.importFormData(formData), 0);
    },
  };
}

const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const WP_NS = 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing';
const A_NS = 'http://schemas.openxmlformats.org/drawingml/2006/main';
const PIC_NS = 'http://schemas.openxmlformats.org/drawingml/2006/picture';
const R_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

/** EMU per point (914400 EMU/inch ÷ 72pt/inch) — OOXML drawing offsets are always in EMU. */
const EMU_PER_PT = 12700;

/** A self-contained, fully static replacement for the inline watermark <w:drawing> Syncfusion
 * exported — only the relationship id and size are substituted in, both read verbatim off the
 * node being replaced (the corner offset is derived from that same size plus the fixed page
 * dimensions, not passed in). Mirrors the same `<wp:anchor>` structure and `<a:lum>` "Washout"
 * recolor real Word's own Picture Watermark feature generates: inset from the page's
 * bottom-right corner, behind the text, ignored by text wrapping. */
function watermarkDrawingXml(rId: string, cx: string, cy: string): string {
  const marginEmu = CORNER_MARGIN_PT * EMU_PER_PT;
  const offsetX = Math.max(0, PAGE_WIDTH_PT * EMU_PER_PT - Number(cx) - marginEmu);
  const offsetY = Math.max(0, PAGE_HEIGHT_PT * EMU_PER_PT - Number(cy) - marginEmu);
  return (
    `<w:drawing xmlns:w="${W_NS}" xmlns:wp="${WP_NS}" xmlns:a="${A_NS}" xmlns:pic="${PIC_NS}" xmlns:r="${R_NS}">` +
    '<wp:anchor distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="251659264" ' +
    'behindDoc="1" locked="0" layoutInCell="1" allowOverlap="1">' +
    '<wp:simplePos x="0" y="0" />' +
    `<wp:positionH relativeFrom="page"><wp:posOffset>${offsetX}</wp:posOffset></wp:positionH>` +
    `<wp:positionV relativeFrom="page"><wp:posOffset>${offsetY}</wp:posOffset></wp:positionV>` +
    `<wp:extent cx="${cx}" cy="${cy}" />` +
    '<wp:effectExtent l="0" t="0" r="0" b="0" />' +
    '<wp:wrapNone />' +
    `<wp:docPr id="1" name="Watermark" descr="${WATERMARK_MARKER}" />` +
    '<wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1" /></wp:cNvGraphicFramePr>' +
    '<a:graphic>' +
    '<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
    '<pic:pic>' +
    '<pic:nvPicPr><pic:cNvPr id="0" name="" descr="" /><pic:cNvPicPr>' +
    '<a:picLocks noChangeAspect="1" noChangeArrowheads="1" /></pic:cNvPicPr></pic:nvPicPr>' +
    '<pic:blipFill>' +
    `<a:blip r:embed="${rId}"><a:lum bright="70000" contrast="-70000" /></a:blip>` +
    '<a:stretch><a:fillRect /></a:stretch>' +
    '</pic:blipFill>' +
    '<pic:spPr bwMode="auto">' +
    `<a:xfrm><a:off x="0" y="0" /><a:ext cx="${cx}" cy="${cy}" /></a:xfrm>` +
    '<a:prstGeom prst="rect"><a:avLst /></a:prstGeom>' +
    '</pic:spPr>' +
    '</pic:pic>' +
    '</a:graphicData>' +
    '</a:graphic>' +
    '</wp:anchor>' +
    '</w:drawing>'
  );
}

/**
 * Post-export fix-up: turns the plain inline watermark image `applyDocxHeaderWatermark` inserted
 * into a real, centered, washed-out, behind-text watermark. Safe by construction — see the long
 * comment above. A no-op (returns the input blob unchanged) if the marker isn't found in any
 * part, so a failed/skipped watermark insertion never breaks export.
 */
export async function applyDocxWatermarkEffect(blob: Blob): Promise<Blob> {
  const zip = await JSZip.loadAsync(blob);
  const parser = new DOMParser();
  const serializer = new XMLSerializer();
  let changedParts = 0;

  const partNames = Object.keys(zip.files).filter((name) => /^word\/.*\.xml$/.test(name));

  for (const name of partNames) {
    const file = zip.files[name];
    const xmlText = await file.async('text');
    if (!xmlText.includes(WATERMARK_MARKER)) continue;

    const doc = parser.parseFromString(xmlText, 'application/xml');
    if (doc.getElementsByTagName('parsererror').length > 0) continue; // never touch what didn't parse cleanly

    const docPr = Array.from(doc.getElementsByTagNameNS(WP_NS, 'docPr')).find(
      (el) => el.getAttribute('descr') === WATERMARK_MARKER,
    );
    if (!docPr) continue;

    // Walk up from the marker to the <w:drawing> that holds the whole inline image structure —
    // this is what gets replaced wholesale.
    let drawing: Element | null = docPr;
    while (drawing && !(drawing.namespaceURI === W_NS && drawing.localName === 'drawing')) {
      drawing = drawing.parentElement;
    }
    if (!drawing) continue; // unexpected structure — leave it alone rather than guess

    // Already fixed up (idempotent) or not the plain inline shape we expect — skip rather than
    // risk double-processing.
    if (drawing.getElementsByTagNameNS(WP_NS, 'anchor').length > 0) continue;
    const inline = drawing.getElementsByTagNameNS(WP_NS, 'inline')[0];
    const blip = drawing.getElementsByTagNameNS(A_NS, 'blip')[0];
    const extent = drawing.getElementsByTagNameNS(WP_NS, 'extent')[0];
    if (!inline || !blip || !extent) continue;

    const rId = blip.getAttributeNS(R_NS, 'embed');
    const cx = extent.getAttribute('cx');
    const cy = extent.getAttribute('cy');
    if (!rId || !cx || !cy) continue;

    const replacementDoc = parser.parseFromString(watermarkDrawingXml(rId, cx, cy), 'application/xml');
    if (replacementDoc.getElementsByTagName('parsererror').length > 0) continue; // our own template — should never happen
    const newDrawing = doc.importNode(replacementDoc.documentElement, true);
    drawing.parentNode?.replaceChild(newDrawing, drawing);

    const serialized = serializer.serializeToString(doc);
    const declMatch = /^<\?xml[^?]*\?>/.exec(xmlText);
    const hasDecl = /^<\?xml/.test(serialized);
    zip.file(name, declMatch && !hasDecl ? declMatch[0] + serialized : serialized);
    changedParts++;
  }

  if (changedParts === 0) return blob;
  return zip.generateAsync({ type: 'blob' });
}
