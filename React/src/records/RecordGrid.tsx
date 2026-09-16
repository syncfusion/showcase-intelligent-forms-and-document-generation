import { useEffect, useRef, useState } from 'react';
import {
  ColumnDirective,
  ColumnsDirective,
  GridComponent,
  Inject,
  Page,
  Search,
  Sort,
  Toolbar,
} from '@syncfusion/ej2-react-grids';
import type { RowSelectEventArgs } from '@syncfusion/ej2-grids';
import { X } from 'lucide-react';
import type { EmployeeRecord } from '@/types';
import { getEmployees } from '@/data/mockApi';

type GridMode = 'single' | 'cohort';

interface RecordGridProps {
  open: boolean;
  mode: GridMode;
  onClose: () => void;
  /** Single mode: fired as soon as a row is picked. */
  onSelect: (record: EmployeeRecord) => void;
  /** Cohort mode: fired from "Done" with every checked record. */
  onConfirmCohort: (records: EmployeeRecord[]) => void;
}

/** Command-palette-style modal: searchable, multi-column employee grid.
 * Single mode auto-fills on row click; cohort mode multi-selects for mail merge. */
export function RecordGrid({ open, mode, onClose, onSelect, onConfirmCohort }: RecordGridProps) {
  const [records, setRecords] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const gridRef = useRef<GridComponent>(null);
  const cohort = mode === 'cohort';

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setSelectedCount(0);
    getEmployees()
      .then((rows) => {
        if (!cancelled) setRecords(rows);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  const syncCount = () => setSelectedCount(gridRef.current?.getSelectedRecords().length ?? 0);

  const confirmCohort = () => {
    const rows = (gridRef.current?.getSelectedRecords() ?? []) as EmployeeRecord[];
    onConfirmCohort(rows);
  };

  return (
    <div className="grid-overlay" role="dialog" aria-modal="true" aria-label="Select an employee record">
      <div className="grid-overlay__scrim" onClick={onClose} />
      <div className="grid-overlay__panel">
        <header className="grid-overlay__header">
          <h2>{cohort ? 'Select records for mail merge' : 'Select an employee record'}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </header>

        {loading && <p className="grid-overlay__status">Loading records…</p>}

        {!loading && (
          <GridComponent
            ref={gridRef}
            dataSource={records}
            allowSorting
            toolbar={['Search']}
            height={cohort ? 380 : 420}
            selectionSettings={
              cohort ? { persistSelection: true, type: 'Multiple', checkboxOnly: true } : undefined
            }
            rowSelected={(e: RowSelectEventArgs) => {
              if (cohort) {
                syncCount();
                return;
              }
              const record = e.data as EmployeeRecord | undefined;
              if (record) onSelect(record);
            }}
            rowDeselected={cohort ? syncCount : undefined}
          >
            <ColumnsDirective>
              {cohort && <ColumnDirective type="checkbox" width="46" />}
              <ColumnDirective field="id" headerText="ID" width="100" isPrimaryKey />
              <ColumnDirective field="fullName" headerText="Name" width="150" />
              <ColumnDirective field="department" headerText="Department" width="140" />
              <ColumnDirective field="designation" headerText="Title" width="170" />
              <ColumnDirective field="location" headerText="Location" width="150" />
              <ColumnDirective field="email" headerText="Email" width="200" />
            </ColumnsDirective>
            <Inject services={[Page, Sort, Search, Toolbar]} />
          </GridComponent>
        )}

        {!loading && cohort && (
          <footer className="grid-overlay__footer">
            <span>{selectedCount} selected for mail merge</span>
            <button type="button" className="btn btn--primary btn--sm" onClick={confirmCohort} disabled={selectedCount === 0}>
              Done
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}
