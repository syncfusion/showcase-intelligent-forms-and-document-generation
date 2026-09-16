import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  FileDown,
  Files,
  FileText,
  Library,
  PanelRightClose,
  PanelRightOpen,
  RotateCcw,
  ScanLine,
  Users,
  User,
  Save,
  Wand2,
} from 'lucide-react';
import type { EmployeeRecord, ExportFormat, FormFieldKind, SessionTemplateRecord, TemplateMeta } from '@/types';
import { DocumentStage, type DocumentStageHandle } from '@/editor/DocumentStage';
import { useFieldSync } from '@/editor/fieldSync';
import { exportImagePdf, saveDocx } from '@/editor/exporters';
import {
  applyMailMerge,
  generateCohort,
  tokensForRecord,
  tokensFromFields,
  type CohortProgress,
} from '@/editor/mailMerge';
import { downloadZip } from '@/editor/zip';
import { PREDEFINED_BUILDERS } from '@/templates/predefinedBuilders';
import { IconButton } from '@/components/IconButton';
import { GenerateMenu, type GenerateMenuItem } from '@/components/GenerateMenu';
import { FieldPanel } from '@/panel/FieldPanel';
import { FieldScanReport } from '@/panel/FieldScanReport';
import { RecordGrid } from '@/records/RecordGrid';
import { TemplateGallery } from '@/templates/TemplateGallery';
import { NewTemplateDialog, pickAccent } from '@/templates/NewTemplateDialog';
import { InsertFieldPanel } from '@/panel/InsertFieldPanel';
import { STARTER_BUILDERS, type StarterKind } from '@/templates/authoring/starters';
import { insertLabeledField, toFieldName, type InsertFieldDef } from '@/editor/insertField';
import { saveSessionTemplate } from '@/data/mockApi';
import { AuthorTemplates } from '@/templates/authoring/AuthorTemplates';
import { ThemeToggle } from '@/theme/ThemeToggle';
import { useTheme } from '@/theme/useTheme';
import { BrowserRouter } from 'react-router-dom';
import { getPublicBasePath } from './basePath';

type Banner = { kind: 'error' | 'success' | 'info'; message: string } | null;
type FillMode = 'single' | 'cohort';

/** True only when explicitly opted into the dev-only template-authoring route. */
function isAuthoringRoute(): boolean {
  return new URLSearchParams(window.location.search).get('authoring') === '1';
}

export default function App() {
  return isAuthoringRoute() ? <AuthorTemplates /> : <HrDocStudioApp />;
}

/** The real app shell. Split out so its hooks are never called conditionally (see App above). */
function HrDocStudioApp() {
  const stageRef = useRef<DocumentStageHandle>(null);
  const [stageReady, setStageReady] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<TemplateMeta | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [gridOpen, setGridOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [newTemplateOpen, setNewTemplateOpen] = useState(false);
  const [galleryRefreshKey, setGalleryRefreshKey] = useState(0);
  const [banner, setBanner] = useState<Banner>(null);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [fillMode, setFillMode] = useState<FillMode>('single');
  const [cohort, setCohort] = useState<EmployeeRecord[]>([]);
  // The record last used to auto-fill in single mode — its columns also feed «token» merge on Generate.
  const [selectedRecord, setSelectedRecord] = useState<EmployeeRecord | null>(null);
  const [cohortProgress, setCohortProgress] = useState<CohortProgress | null>(null);
  // The template's SFDT exactly as it was loaded — "Reset form" reopens this for a clean slate.
  const pristineSfdtRef = useRef<string | null>(null);
  // While a cohort run is reopening the template between records, documentChange fires
  // repeatedly — this suppresses the re-scan churn until the run ends.
  const bulkRunningRef = useRef(false);
  // True while a predefined builder is populating the editor — ignore its interim events.
  const buildingRef = useRef(false);
  // Set true when we deliberately (re)load the editor's document; the first documentChange
  // after that consumes it. Guards against stray documentChange events (e.g. from a dropdown
  // option rewrite) triggering a re-scan that would wipe an in-progress auto-fill.
  const expectReloadRef = useRef(false);
  // Authoring vs. fill mode. 'author' = designing a new template (Insert-Fields palette,
  // Save-only header); 'fill' = the normal fill/generate experience.
  const [editorMode, setEditorMode] = useState<'author' | 'fill'>('fill');
  const [authorMeta, setAuthorMeta] = useState<{ id: string; title: string; description: string; accent: string; docType: 'letter' | 'form' } | null>(null);

  const theme = useTheme();
  const getEditor = useCallback(() => stageRef.current?.getEditor() ?? null, []);
  const fieldSync = useFieldSync(getEditor);
  // fieldSync is a fresh object each render; its methods are individually stable (useCallback).
  // Depend on the methods, never the object, in effects/callbacks — or they re-run every render.
  const { scanAndBind, refreshFromDoc } = fieldSync;

  useEffect(() => {
    if (!banner) return;
    const t = window.setTimeout(() => setBanner(null), 4000);
    return () => window.clearTimeout(t);
  }, [banner]);

  // Load whichever template is active into the (persistent) editor instance.
  useEffect(() => {
    if (!stageReady || !activeTemplate) return;
    const editor = getEditor();
    if (!editor) return;

    expectReloadRef.current = true;
    (async () => {
      try {
        const builder = activeTemplate.builderId
          ? PREDEFINED_BUILDERS[activeTemplate.builderId]
          : activeTemplate.starter
            ? STARTER_BUILDERS[activeTemplate.starter]
            : undefined;
        if (builder) {
          // Build the predefined form at runtime from source (createBuilderKit opens a blank
          // doc first). Its interim events are ignored via buildingRef; we scan explicitly
          // once it's done and keep the guards up through the current macrotask so any
          // queued openBlank/insert events don't trigger a second scan.
          buildingRef.current = true;
          builder(editor);
          scanAndBind();
          expectReloadRef.current = false;
          window.setTimeout(() => {
            buildingRef.current = false;
            const live = getEditor();
            if (!live) return;
            pristineSfdtRef.current = live.serialize();
            // Builders leave the caret at document end — open every template showing page 1.
            try {
              live.selection.moveToDocumentStart();
              live.scrollToPage(1);
            } catch {
              /* scroll-to-top is best effort */
            }
          }, 0);
        } else if (activeTemplate.sfdtContent) {
          editor.open(activeTemplate.sfdtContent);
        } else if (activeTemplate.sfdtPath) {
          const res = await fetch(activeTemplate.sfdtPath);
          if (!res.ok) throw new Error(`Failed to fetch template: ${res.status}`);
          editor.open(await res.text());
        } else {
          editor.openBlank();
        }
      } catch (err) {
        buildingRef.current = false;
        setBanner({ kind: 'error', message: `Could not load "${activeTemplate.title}": ${(err as Error).message}` });
      }
    })();
  }, [activeTemplate, stageReady, getEditor, scanAndBind]);

  const handleDocumentLoaded = useCallback(() => {
    if (bulkRunningRef.current || buildingRef.current) return;
    // Only (re)scan on a deliberate document (re)load — not on stray documentChange events
    // that Syncfusion emits when form-field metadata is rewritten.
    if (!expectReloadRef.current) return;
    expectReloadRef.current = false;
    scanAndBind();
    // Snapshot the freshly loaded template for "Reset form" (re-captured after a reset too —
    // it's the same pristine content each time, so that's fine).
    const editor = getEditor();
    if (!editor) return;
    pristineSfdtRef.current = editor.serialize();
    // Open at the top — no auto-scroll to the last page.
    window.setTimeout(() => {
      try {
        editor.selection.moveToDocumentStart();
        editor.scrollToPage(1);
      } catch {
        /* scroll-to-top is best effort */
      }
    }, 0);
  }, [scanAndBind, getEditor]);

  const handleSelectTemplate = useCallback((template: TemplateMeta) => {
    setActiveTemplate(template);
    setPanelOpen(true);
    setFillMode('single');
    setCohort([]);
    setSelectedRecord(null);
  }, []);

  const handleCreateTemplate = useCallback((title: string, description: string, starter: StarterKind) => {
    const id = `session-${Date.now()}`;
    const accent = pickAccent(title);
    const docType: 'letter' | 'form' = starter === 'letter' ? 'letter' : 'form';
    setAuthorMeta({ id, title, description: description || 'Created this session.', accent, docType });
    setEditorMode('author');
    setPanelOpen(true);
    setNewTemplateOpen(false);
    setSelectedRecord(null);
    setCohort([]);
    setFillMode('single');
    // Transient meta drives the load effect to build the chosen starter. Not persisted —
    // Save serializes the finished document into a SessionTemplateRecord.
    setActiveTemplate({ id, title, description, accent, source: 'session', starter, docType });
  }, []);

  const handleSaveTemplate = useCallback(async () => {
    const editor = getEditor();
    if (!editor || !authorMeta) return;
    const sfdtContent = editor.serialize();
    const record: SessionTemplateRecord = {
      id: authorMeta.id,
      title: authorMeta.title,
      description: authorMeta.description,
      accent: authorMeta.accent,
      sfdtContent,
      createdAt: new Date().toISOString(),
      docType: authorMeta.docType,
    };
    await saveSessionTemplate(record);
    setGalleryRefreshKey((k) => k + 1);
    // Keep the same document loaded; switch to fill mode and bind the fields just authored.
    pristineSfdtRef.current = sfdtContent;
    setEditorMode('fill');
    scanAndBind();
    setBanner({ kind: 'success', message: `"${authorMeta.title}" saved — fill it in, or reopen it from the gallery.` });
  }, [authorMeta, getEditor, scanAndBind]);

  const handleInsertField = useCallback(
    (def: InsertFieldDef) => {
      const editor = getEditor();
      if (!editor) return;
      insertLabeledField(editor, def);
      scanAndBind();
    },
    [getEditor, scanAndBind],
  );

  const handleInsertCustom = useCallback(
    (label: string, kind: FormFieldKind) => {
      const editor = getEditor();
      if (!editor) return;
      insertLabeledField(editor, { label, name: toFieldName(label), kind });
      scanAndBind();
    },
    [getEditor, scanAndBind],
  );

  const handleExitAuthor = useCallback(() => {
    setActiveTemplate(null);
    setEditorMode('fill');
    setAuthorMeta(null);
    setBanner(null);
  }, []);

  const handleSelectRecord = useCallback(
    (record: EmployeeRecord) => {
      fieldSync.applyRecordAutoFill(record);
      setSelectedRecord(record);
      setGridOpen(false);
      setBanner({ kind: 'success', message: `Auto-filled from ${record.fullName} (${record.id}).` });
    },
    [fieldSync],
  );

  const handleConfirmCohort = useCallback((records: EmployeeRecord[]) => {
    setCohort(records);
    setGridOpen(false);
    setBanner({
      kind: 'success',
      message: `${records.length} record${records.length === 1 ? '' : 's'} queued for mail merge.`,
    });
  }, []);

  const handleChangeMode = useCallback((next: FillMode) => {
    setFillMode(next);
    if (next === 'single') setCohort([]);
  }, []);

  const handleReset = useCallback(() => {
    const editor = getEditor();
    setCohort([]);
    setSelectedRecord(null);
    if (editor && pristineSfdtRef.current) {
      // Reopen the pristine template — a guaranteed clean slate. This fires documentChange
      // -> handleDocumentLoaded, which re-scans every field fresh (source 'default').
      expectReloadRef.current = true;
      editor.open(pristineSfdtRef.current);
    } else {
      fieldSync.resetForm();
    }
    setBanner({ kind: 'info', message: 'Form reset to the blank template.' });
  }, [fieldSync, getEditor]);

  const runSingleExport = useCallback(
    async (format: ExportFormat) => {
      const editor = getEditor();
      if (!editor) return;
      const { blocking, pendingEmployee } = fieldSync.validateForGenerate(activeTemplate?.docType);
      if (blocking.length > 0) {
        const names = blocking.slice(0, 3).map((f) => f.label).join(', ');
        setBanner({
          kind: 'error',
          message: `Complete the HR field${blocking.length > 1 ? 's' : ''} first: ${names}${blocking.length > 3 ? '…' : ''}.`,
        });
        setPanelOpen(true);
        return;
      }
      const baseName = (activeTemplate?.title ?? 'Document').replace(/[^\w\- ]+/g, '').trim() || 'Document';
      setExporting(format);
      // Replace any «token» prose with the current values for this one document, then restore
      // the editable template afterwards so the merge is non-destructive. When a record was
      // selected, its columns fill tokens the template has no bound field for (e.g. the
      // Welcome Letter's «manager» / «location»).
      const pristine = editor.serialize();
      const formData = editor.exportFormData();
      const tokens = selectedRecord
        ? tokensForRecord(fieldSync.fields, selectedRecord)
        : tokensFromFields(fieldSync.fields);
      const merged = applyMailMerge(editor, tokens);
      try {
        if (merged.replacedCount > 0) await new Promise((r) => window.setTimeout(r, 40));
        if (format === 'docx' || format === 'both') await saveDocx(editor, baseName);
        if (format === 'pdf' || format === 'both') await exportImagePdf(editor, `${baseName}.pdf`);
        const okBase = `${format === 'both' ? 'DOCX + PDF' : format.toUpperCase()} generated`;
        const pendingNote =
          pendingEmployee.length > 0
            ? ` — ${pendingEmployee.length} employee field${pendingEmployee.length > 1 ? 's' : ''} left blank for the new hire to complete.`
            : '.';
        setBanner({ kind: pendingEmployee.length > 0 ? 'info' : 'success', message: okBase + pendingNote });
      } catch (err) {
        setBanner({ kind: 'error', message: `Export failed: ${(err as Error).message}` });
      } finally {
        if (merged.replacedCount > 0) {
          editor.open(pristine);
          window.setTimeout(() => editor.importFormData(formData), 0);
        }
        setExporting(null);
      }
    },
    [activeTemplate, fieldSync, getEditor, selectedRecord],
  );

  const runCohortExport = useCallback(
    async (format: ExportFormat) => {
      const editor = getEditor();
      if (!editor) return;
      if (cohort.length === 0) {
        setBanner({ kind: 'error', message: 'Select at least one record for the cohort.' });
        return;
      }
      const baseName = (activeTemplate?.title ?? 'Document').replace(/[^\w\- ]+/g, '').trim() || 'Document';
      setExporting(format);
      setCohortProgress({ done: 0, total: cohort.length, label: 'Starting…' });
      bulkRunningRef.current = true;
      try {
        const files = await generateCohort(editor, fieldSync.fields, cohort, {
          format,
          baseName,
          onProgress: setCohortProgress,
        });
        await downloadZip(files, `${baseName}-mail-merge`);
        setBanner({
          kind: 'success',
          message: `${files.length} file${files.length === 1 ? '' : 's'} for ${cohort.length} record${
            cohort.length === 1 ? '' : 's'
          } packaged into a ZIP.`,
        });
      } catch (err) {
        setBanner({ kind: 'error', message: `Mail merge failed: ${(err as Error).message}` });
      } finally {
        // Let the final restore's documentChange land before re-enabling the scan handler.
        window.setTimeout(() => {
          bulkRunningRef.current = false;
        }, 250);
        setExporting(null);
        setCohortProgress(null);
      }
    },
    [activeTemplate, cohort, fieldSync.fields, getEditor],
  );

  const handleGenerate = useCallback(
    (format: ExportFormat) => {
      if (exporting) return;
      if (fillMode === 'cohort') void runCohortExport(format);
      else void runSingleExport(format);
    },
    [exporting, fillMode, runCohortExport, runSingleExport],
  );

  const inEditor = activeTemplate !== null;
  const cohortReady = fillMode === 'single' || cohort.length > 0;

  const generateLabel =
    fillMode === 'cohort'
      ? cohort.length > 0
        ? `Generate ${cohort.length} packet${cohort.length === 1 ? '' : 's'}`
        : 'Generate packets'
      : 'Generate DOCX';

  const generateItems: GenerateMenuItem[] =
    fillMode === 'cohort'
      ? [
          { key: 'docx', label: 'DOCX only', icon: <FileText size={15} /> },
          { key: 'pdf', label: 'PDF only', icon: <FileDown size={15} /> },
        ]
      : [
          { key: 'pdf', label: 'Generate PDF', icon: <FileDown size={15} /> },
          { key: 'both', label: 'DOCX + PDF', icon: <Files size={15} /> },
        ];

  const onGeneratePrimary = () => handleGenerate(fillMode === 'cohort' ? 'both' : 'docx');

  return (
     <BrowserRouter basename={getPublicBasePath()}>
    <div className="app-shell">
      {!inEditor && <ThemeToggle resolved={theme.resolved} onToggle={theme.toggle} />}

      {inEditor && editorMode === 'fill' && (
        <header className="command-bar">
          <div className="command-bar__title">
            <IconButton
              icon={<ArrowLeft size={16} />}
              label="Back to templates"
              onClick={() => {
                setActiveTemplate(null);
                setBanner(null);
                setCohort([]);
                setSelectedRecord(null);
                setFillMode('single');
                setEditorMode('fill');
                setAuthorMeta(null);
              }}
            />
            <span className="command-bar__name">{activeTemplate?.title}</span>
          </div>

          <div className="command-bar__actions">
            <div className="segmented" role="tablist" aria-label="Fill mode">
              <button
                type="button"
                role="tab"
                aria-selected={fillMode === 'single'}
                title="Single record"
                className={`segmented__btn ${fillMode === 'single' ? 'segmented__btn--active' : ''}`}
                onClick={() => handleChangeMode('single')}
              >
                <User size={15} />
                <span>Single</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={fillMode === 'cohort'}
                title="Cohort · mail merge"
                className={`segmented__btn ${fillMode === 'cohort' ? 'segmented__btn--active' : ''}`}
                onClick={() => handleChangeMode('cohort')}
              >
                <Users size={15} />
                <span>Cohort{cohort.length ? ` · ${cohort.length}` : ''}</span>
              </button>
            </div>

            <IconButton
              icon={<Library size={16} />}
              label={fillMode === 'cohort' ? 'Select cohort records' : 'Select a record'}
              onClick={() => setGridOpen(true)}
            />
            <IconButton icon={<ScanLine size={16} />} label="Field scan report" onClick={() => setScanOpen(true)} />
            <IconButton icon={<RotateCcw size={16} />} label="Reset form to defaults" onClick={handleReset} />

            <span className="command-bar__sep" aria-hidden="true" />

            <GenerateMenu
              label={generateLabel}
              icon={fillMode === 'cohort' ? <Files size={16} /> : <FileText size={16} />}
              items={generateItems}
              disabled={!cohortReady}
              busy={exporting !== null}
              onPrimary={onGeneratePrimary}
              onSelect={(key) => handleGenerate(key as ExportFormat)}
            />

            <IconButton
              icon={panelOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
              label={panelOpen ? 'Hide field panel' : 'Show field panel'}
              active={panelOpen}
              onClick={() => setPanelOpen((v) => !v)}
            />
          </div>
        </header>
      )}

      {inEditor && editorMode === 'author' && (
        <header className="command-bar">
          <div className="command-bar__title">
            <IconButton icon={<ArrowLeft size={16} />} label="Discard and go back" onClick={handleExitAuthor} />
            <span className="command-bar__name">
              <Wand2 size={14} /> Designing · {authorMeta?.title}
            </span>
          </div>
          <div className="command-bar__actions">
            <IconButton icon={<ScanLine size={16} />} label="Field scan report" onClick={() => setScanOpen(true)} />
            <span className="command-bar__sep" aria-hidden="true" />
            <button type="button" className="btn btn--primary command-bar__save" onClick={() => void handleSaveTemplate()}>
              <Save size={15} /> Save template
            </button>
            <IconButton
              icon={panelOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
              label={panelOpen ? 'Hide insert panel' : 'Show insert panel'}
              active={panelOpen}
              onClick={() => setPanelOpen((v) => !v)}
            />
          </div>
        </header>
      )}

      {banner && <div className={`banner banner--${banner.kind}`}>{banner.message}</div>}

      <main className={`canvas ${inEditor ? 'canvas--editor' : 'canvas--gallery'}`}>
        {!inEditor && (
          <TemplateGallery
            onSelect={handleSelectTemplate}
            onCreateNew={() => setNewTemplateOpen(true)}
            refreshKey={galleryRefreshKey}
          />
        )}
        <div className={`stage-wrap ${inEditor ? 'stage-wrap--visible' : ''}`}>
          <DocumentStage
            ref={stageRef}
            onReady={() => setStageReady(true)}
            onDocumentLoaded={handleDocumentLoaded}
            onChromeHeight={(bottomPx) => {
              // Keep the floating field panel flush below the editor ribbon.
              document.documentElement.style.setProperty('--panel-top', `${Math.max(bottomPx, 8)}px`);
            }}
            onContentChange={() => {
              // A cohort run mutates the doc per-record and a builder inserts it field by
              // field; don't let those transient states stream into the panel.
              if (!bulkRunningRef.current && !buildingRef.current) refreshFromDoc();
            }}
          />
        </div>
      </main>

      {inEditor && editorMode === 'fill' && (
        <FieldPanel
          fields={fieldSync.fields}
          onChange={fieldSync.updateFromPanel}
          open={panelOpen}
          onClose={() => setPanelOpen(false)}
          loadingDropdowns={fieldSync.loadingDropdowns}
          docType={activeTemplate?.docType}
        />
      )}
      {inEditor && editorMode === 'author' && (
        <InsertFieldPanel
          open={panelOpen}
          onClose={() => setPanelOpen(false)}
          onInsert={handleInsertField}
          onInsertCustom={handleInsertCustom}
        />
      )}

      <RecordGrid
        open={gridOpen}
        mode={fillMode}
        onClose={() => setGridOpen(false)}
        onSelect={handleSelectRecord}
        onConfirmCohort={handleConfirmCohort}
      />
      <FieldScanReport
        open={scanOpen}
        fields={fieldSync.fields}
        onClose={() => setScanOpen(false)}
        onRevalidate={() => {
          // Re-read the field list from the document (picks up fields added/removed via the
          // editor's Developer tab) and re-validate.
          const ok = fieldSync.rescan();
          setBanner(
            ok
              ? { kind: 'success', message: 'Rescanned — all fields valid.' }
              : { kind: 'error', message: 'Rescanned — some fields need attention.' },
          );
        }}
      />
      <NewTemplateDialog open={newTemplateOpen} onClose={() => setNewTemplateOpen(false)} onCreate={handleCreateTemplate} />

      {cohortProgress && (
        <div className="gen-overlay" role="dialog" aria-modal="true" aria-label="Generating mail merge">
          <div className="gen-overlay__card">
            <p className="gen-overlay__eyebrow">Mail merge</p>
            <p className="gen-overlay__title">
              {cohortProgress.done} of {cohortProgress.total} · {cohortProgress.label}
            </p>
            <div className="gen-overlay__track">
              <div
                className="gen-overlay__fill"
                style={{ width: `${Math.round((cohortProgress.done / cohortProgress.total) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
    </BrowserRouter>
  );
}
