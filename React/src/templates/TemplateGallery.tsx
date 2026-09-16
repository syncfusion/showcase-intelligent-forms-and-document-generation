import { useEffect, useState } from 'react';
import type { TemplateMeta } from '@/types';
import { getTemplates } from '@/data/mockApi';

interface TemplateGalleryProps {
  onSelect: (template: TemplateMeta) => void;
  onCreateNew: () => void;
  /** Bumped by the parent whenever a session template is created, to refetch the catalog. */
  refreshKey: number;
}

/** Modern card gallery for picking a template — the app's landing surface. */
export function TemplateGallery({ onSelect, onCreateNew, refreshKey }: TemplateGalleryProps) {
  const [templates, setTemplates] = useState<TemplateMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getTemplates().then((list) => {
      if (!cancelled) {
        setTemplates(list);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return (
    <div className="gallery">
      <div className="gallery__intro">
        <h1>HR Doc Studio</h1>
        <p>Pick a template to fill, validate, and export as DOCX or PDF.</p>
      </div>

      <div className="gallery__grid">
        {loading &&
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="gallery-card gallery-card--skeleton" />)}

        {!loading &&
          templates.map((template) => {
            const available = Boolean(template.builderId || template.sfdtPath || template.sfdtContent);
            return (
              <button
                key={template.id}
                type="button"
                className={`gallery-card gallery-card--${template.accent} ${available ? '' : 'gallery-card--disabled'}`}
                onClick={() => available && onSelect(template)}
                disabled={!available}
              >
                {template.image ? (
                  <img
                    className="gallery-card__cover"
                    src={template.image}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                  />
                ) : (
                  <div className="gallery-card__cover" aria-hidden="true" />
                )}
                <div className="gallery-card__body">
                  <h3>{template.title}</h3>
                  <p>{template.description}</p>
                  {!available && <span className="gallery-card__badge">Coming soon</span>}
                  {template.source === 'session' && <span className="gallery-card__badge">This session</span>}
                </div>
              </button>
            );
          })}

        {!loading && (
          <button type="button" className="gallery-card gallery-card--new" onClick={onCreateNew}>
            <div className="gallery-card__body gallery-card__body--center">
              <span className="gallery-card__plus">+</span>
              <h3>New Template</h3>
              <p>Start from a blank document (saved for this session only)</p>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
