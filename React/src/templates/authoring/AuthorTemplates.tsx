import { useCallback, useRef, useState } from 'react';
import type { DocumentEditor } from '@syncfusion/ej2-documenteditor';
import { DocumentStage, type DocumentStageHandle } from '@/editor/DocumentStage';
import { buildEmployeeOnboarding } from './buildEmployeeOnboarding';
import { buildEmployeeInformationSheet } from './buildEmployeeInformationSheet';
import { buildWelcomeLetter } from './buildWelcomeLetter';
import { buildOfferLetter } from './buildOfferLetter';
import { buildNdaAgreement } from './buildNdaAgreement';
import { buildAssetRequestForm } from './buildAssetRequestForm';
import { buildBenefitsEnrollmentForm } from './buildBenefitsEnrollmentForm';
import { buildBackgroundVerificationForm } from './buildBackgroundVerificationForm';

const TEMPLATES: { name: string; label: string; build: (editor: DocumentEditor) => void }[] = [
  { name: 'employee-onboarding', label: 'Employee Onboarding', build: buildEmployeeOnboarding },
  { name: 'employee-information-sheet', label: 'Employee Info Sheet', build: buildEmployeeInformationSheet },
  { name: 'welcome-letter', label: 'Welcome Letter', build: buildWelcomeLetter },
  { name: 'offer-letter', label: 'Offer Letter', build: buildOfferLetter },
  { name: 'nda-agreement', label: 'NDA Agreement', build: buildNdaAgreement },
  { name: 'asset-request-form', label: 'Asset Request', build: buildAssetRequestForm },
  { name: 'benefits-enrollment-form', label: 'Benefits Enrollment', build: buildBenefitsEnrollmentForm },
  { name: 'background-verification-form', label: 'Background Verification', build: buildBackgroundVerificationForm },
];

/**
 * Dev-only template authoring tool, reachable at /?authoring=1 (never linked from the app's
 * own navigation). Builds a template with the live DocumentEditor's own APIs — guaranteeing
 * valid SFDT with no backend DOCX conversion step — then POSTs the result to a Vite dev
 * middleware (see vite.config.ts) that writes it into public/templates/.
 */
export function AuthorTemplates() {
  const stageRef = useRef<DocumentStageHandle>(null);
  const [status, setStatus] = useState<string>('Ready.');

  const build = useCallback((name: string, run: (editor: DocumentEditor) => void) => {
    const editor = stageRef.current?.getEditor();
    if (!editor) {
      setStatus('Editor not ready yet.');
      return;
    }
    run(editor);
    setStatus(`Built "${name}". Review it below, then click Save.`);
  }, []);

  const save = useCallback(async (name: string) => {
    const editor = stageRef.current?.getEditor();
    if (!editor) return;
    setStatus('Saving…');
    try {
      const sfdt = editor.serialize();
      const res = await fetch(`/__dev/save-template?name=${encodeURIComponent(name)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: sfdt,
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus(`Saved to public/templates/${name}.sfdt`);
    } catch (err) {
      setStatus(`Save failed: ${(err as Error).message}`);
    }
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div
        style={{
          padding: '10px 16px',
          borderBottom: '1px solid #ddd',
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <strong>Template Authoring (dev only)</strong>
        {TEMPLATES.map((t) => (
          <span key={t.name} style={{ display: 'inline-flex', gap: 4 }}>
            <button type="button" onClick={() => build(t.name, t.build)}>
              Build {t.label}
            </button>
            <button type="button" onClick={() => save(t.name)}>
              Save
            </button>
          </span>
        ))}
        <span style={{ marginLeft: 8, color: '#555' }}>{status}</span>
      </div>
      <div style={{ flex: 1 }}>
        <DocumentStage ref={stageRef} />
      </div>
    </div>
  );
}
