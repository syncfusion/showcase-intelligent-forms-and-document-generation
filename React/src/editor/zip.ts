import JSZip from 'jszip';
import type { CohortFile } from './mailMerge';

/** Bundles the cohort's documents into one archive and triggers a single download. */
export async function downloadZip(files: CohortFile[], zipName: string): Promise<void> {
  const zip = new JSZip();
  for (const file of files) zip.file(file.name, file.blob);
  const blob = await zip.generateAsync({ type: 'blob' });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = zipName.endsWith('.zip') ? zipName : `${zipName}.zip`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Revoke after the click has been dispatched.
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
