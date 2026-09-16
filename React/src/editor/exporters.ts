import type { DocumentEditor } from '@syncfusion/ej2-documenteditor';
import { PdfBitmap, PdfDocument, SizeF } from '@syncfusion/ej2-pdf-export';
import { fixLegacyFormFieldCodes } from './formFieldFix';
import { fixPercentTableWidths } from './tableWidthFix';
import { applyDocxHeaderWatermark, applyDocxWatermarkEffect, drawPdfWatermark, getWatermark } from './watermark';

/** Runs every post-export repair for a Syncfusion `saveAsBlob('Docx')` defect — see
 * formFieldFix.ts, tableWidthFix.ts, and watermark.ts (applyDocxWatermarkEffect) for what each
 * works around and why. applyDocxWatermarkEffect is a no-op when no watermark was inserted, so
 * it's always safe to run here regardless of whether the watermark asset loaded. */
async function sanitizeDocxBlob(raw: Blob): Promise<Blob> {
  return applyDocxWatermarkEffect(await fixPercentTableWidths(await fixLegacyFormFieldCodes(raw)));
}

/** CSS-pixel to PDF-point conversion at the standard 96dpi the editor renders at. */
const PT_PER_PX = 72 / 96;

function stripDataUriPrefix(dataUri: string): string {
  const commaIndex = dataUri.indexOf(',');
  return commaIndex >= 0 ? dataUri.slice(commaIndex + 1) : dataUri;
}

/** Waits for an <img> produced by exportAsImage to finish decoding before it's read. */
async function decodeImage(img: HTMLImageElement): Promise<void> {
  if (img.complete && img.naturalWidth > 0) return;
  if (typeof img.decode === 'function') {
    try {
      await img.decode();
      return;
    } catch {
      // fall through to the load-event fallback below
    }
  }
  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
    img.onerror = () => resolve();
  });
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * Saves the current document as a real, editable .docx via Syncfusion's native export.
 * A small Enterprise Edition logo is stamped into the page header first (via the editor's own
 * APIs — see watermark.ts for why), then the document is restored to exactly its pre-export
 * state so the watermark never lingers in the live, editable document. The raw export is then
 * run through sanitizeDocxBlob() — see formFieldFix.ts and tableWidthFix.ts for the two
 * Syncfusion export defects it works around (neither is the watermark — that turned out to be
 * unrelated to why Word refused to open, then badly mis-rendered, every generated file).
 */
export async function saveDocx(editor: DocumentEditor, fileName = 'CompletedDoc'): Promise<void> {
  const asset = await getWatermark().catch(() => null);
  const watermark = asset ? await applyDocxHeaderWatermark(editor, asset) : null;
  try {
    const raw = await editor.saveAsBlob('Docx');
    const blob = await sanitizeDocxBlob(raw);
    downloadBlob(blob, fileName.endsWith('.docx') ? fileName : `${fileName}.docx`);
  } finally {
    watermark?.restore();
  }
}

/** Same native DOCX export, but returns the blob instead of triggering a download —
 * used when bundling many documents into a single archive (cohort mail merge). */
export async function saveDocxBlob(editor: DocumentEditor): Promise<Blob> {
  const asset = await getWatermark().catch(() => null);
  const watermark = asset ? await applyDocxHeaderWatermark(editor, asset) : null;
  try {
    const raw = await editor.saveAsBlob('Docx');
    return await sanitizeDocxBlob(raw);
  } finally {
    watermark?.restore();
  }
}

/** Image-PDF assembly shared by the download and blob paths. Returns the PdfDocument. */
async function buildImagePdf(editor: DocumentEditor): Promise<PdfDocument> {
  const pdfDocument = new PdfDocument();
  let sizedPage = false;
  // A failed watermark fetch/decode shouldn't break PDF generation — export without it instead.
  const asset = await getWatermark().catch(() => null);
  const wmBitmap = asset ? new PdfBitmap(asset.base64) : null;

  for (let pageNumber = 1; pageNumber <= editor.pageCount; pageNumber++) {
    const image = editor.exportAsImage(pageNumber, 'Jpeg');
    await decodeImage(image);

    const widthPt = (image.naturalWidth || image.width) * PT_PER_PX;
    const heightPt = (image.naturalHeight || image.height) * PT_PER_PX;

    if (!sizedPage) {
      pdfDocument.pageSettings.size = new SizeF(widthPt, heightPt);
      pdfDocument.pageSettings.margins.setMargins(0);
      sizedPage = true;
    }

    const page = pdfDocument.pages.add();
    const bitmap = new PdfBitmap(stripDataUriPrefix(image.src));
    page.graphics.drawImage(bitmap, 0, 0, widthPt, heightPt);
    // Export-only watermark, centered and semi-transparent (never shown in the editor).
    if (asset && wmBitmap) {
      drawPdfWatermark(page as unknown as { graphics: never }, widthPt, heightPt, wmBitmap, asset);
    }
  }
  return pdfDocument;
}

/**
 * Assembles an image-based PDF (CLAUDE.md's client-only export path): each editor page is
 * rasterized via exportAsImage and placed full-bleed on its own PdfDocument page.
 * Known tradeoff: the resulting PDF text is not selectable/searchable (see CLAUDE.md §11).
 */
export async function exportImagePdf(editor: DocumentEditor, fileName = 'CompletedDoc.pdf'): Promise<void> {
  const pdfDocument = await buildImagePdf(editor);
  pdfDocument.save(fileName);
  pdfDocument.destroy();
}

/** Same image-PDF assembly as exportImagePdf, but resolves to the blob instead of
 * downloading — used to place the PDF inside a cohort archive. */
export async function exportImagePdfBlob(editor: DocumentEditor): Promise<Blob> {
  const pdfDocument = await buildImagePdf(editor);
  // save() with no filename resolves to { blobData: Blob } (ej2-pdf-export).
  const { blobData } = (await pdfDocument.save()) as { blobData: Blob };
  pdfDocument.destroy();
  return blobData;
}
