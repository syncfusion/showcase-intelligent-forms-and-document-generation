import type { FormProgress } from './progress';

interface PanelProgressProps {
  progress: FormProgress;
}

/** Sticky completion meter at the top of the field panel: count, %, colored bar, blocker. */
export function PanelProgress({ progress }: PanelProgressProps) {
  const { complete, required, pct, ready, invalid, blocker } = progress;
  const tone = ready ? 'ready' : invalid.length > 0 ? 'invalid' : 'partial';

  return (
    <div className="panel-progress" data-tone={tone}>
      <div className="panel-progress__row">
        <span className="panel-progress__label">
          {required === 0 ? 'No required fields' : `${complete} of ${required} required fields complete`}
        </span>
        <span className="panel-progress__pct">{pct}%</span>
      </div>
      <div className="panel-progress__track">
        <div className="panel-progress__fill" style={{ width: `${pct}%` }} />
      </div>
      {blocker && <p className="panel-progress__blocker">{blocker}</p>}
    </div>
  );
}
