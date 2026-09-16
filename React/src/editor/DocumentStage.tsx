import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { DocumentEditor } from '@syncfusion/ej2-documenteditor';
import {
  ContextMenu,
  DocumentEditorContainerComponent,
  Editor,
  EditorHistory,
  ImageResizer,
  OptionsPane,
  Print,
  Ribbon,
  Search,
  Selection,
  SfdtExport,
  TextExport,
  Toolbar,
  WordExport,
} from '@syncfusion/ej2-react-documenteditor';

// Injected once at module scope, before any DocumentEditorContainerComponent renders.
// The full MS Word-style Ribbon (File / Home / Insert / Layout / References / Review / View /
// Developer) plus every editing dialog, image resizing, export, and the options pane.
// (FormFieldPopUp is an internal `@private` implementation class, not a public injectable
// module — the click-to-edit form-field popup works automatically once enableFormField is set.)
DocumentEditorContainerComponent.Inject(
  Ribbon,
  Toolbar,
  Editor,
  Selection,
  Search,
  SfdtExport,
  WordExport,
  TextExport,
  EditorHistory,
  ContextMenu,
  OptionsPane,
  ImageResizer,
  Print,
);

export interface DocumentStageHandle {
  getEditor: () => DocumentEditor | null;
}

export interface DocumentStageProps {
  /** Fires once the container has mounted and documentEditor is available. */
  onReady?: () => void;
  /** Fires once the document has finished loading and layout has settled. */
  onDocumentLoaded?: () => void;
  /** Fires on every content change (including form-field edits); the caller debounces/guards. */
  onContentChange?: () => void;
  /** Reports the viewport-Y (px) of the ribbon's bottom edge, so overlay panels sit below it. */
  onChromeHeight?: (bottomPx: number) => void;
  className?: string;
}

/** Minimal shape of the container's (private) ribbon module we touch. */
interface RibbonModuleLike {
  ribbonElement?: HTMLElement;
}

/**
 * Thin wrapper around DocumentEditorContainerComponent. This is the *only* place the app
 * touches the Syncfusion container directly — everything else goes through the handle.
 */
export const DocumentStage = forwardRef<DocumentStageHandle, DocumentStageProps>(function DocumentStage(
  { onReady, onDocumentLoaded, onContentChange, onChromeHeight, className },
  ref,
) {
  const containerRef = useRef<DocumentEditorContainerComponent>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      getEditor: () => containerRef.current?.documentEditor ?? null,
    }),
    [],
  );

  useEffect(() => {
    const editor = containerRef.current?.documentEditor;
    if (editor) editor.enableFormField = true;
    return () => cleanupRef.current?.();
  }, []);

  const handleCreated = () => {
    const container = containerRef.current;
    const editor = container?.documentEditor;
    if (editor) editor.enableFormField = true;

    // Keep any overlay panel flush below the (single-row Simplified) ribbon by reporting its
    // bottom edge whenever it changes size.
    try {
      const rb = (container as unknown as { ribbon?: RibbonModuleLike }).ribbon;
      const el = rb?.ribbonElement;
      if (el && onChromeHeight) {
        const report = () => onChromeHeight(Math.round(el.getBoundingClientRect().bottom));
        report();
        window.setTimeout(report, 0);
        const ro = new ResizeObserver(report);
        ro.observe(el);
        window.addEventListener('resize', report);
        cleanupRef.current = () => {
          ro.disconnect();
          window.removeEventListener('resize', report);
        };
      }
    } catch {
      /* ribbon module is optional — panel falls back to its CSS default top */
    }

    onReady?.();
  };

  return (
    <DocumentEditorContainerComponent
      ref={containerRef}
      id="hr-doc-stage"
      className={className}
      height="100%"
      width="100%"
      enableToolbar
      toolbarMode="Ribbon"
      ribbonLayout="Simplified"
      showPropertiesPane={false}
      created={handleCreated}
      documentChange={() => onDocumentLoaded?.()}
      contentChange={() => onContentChange?.()}
    />
  );
});
