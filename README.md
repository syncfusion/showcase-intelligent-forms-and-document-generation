# Intelligent Forms and Document Generation

A data-driven document workflow sample for HR processes, built on the **Syncfusion EJ2 React Document Editor**. An operator picks an HR template, the app scans its form fields and binds them to a floating side panel, fills them manually or auto-fills them from an employee record, validates the inputs, and generates a completed **DOCX** and **PDF** — all client-side, with no backend.

Users can complete application forms, validate information, select employee records, and generate official documents through an intelligent form-based experience.

> **Live demo:** <https://showcase.syncfusion.com/intelligent-forms-doc-generation/>

---

## Table of contents

- [Features](#features)
- [Repository layout](#repository-layout)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting started (local dev)](#getting-started-local-dev)
- [Production build & deployment](#production-build--deployment)
  - [Build](#build)
  - [Run the bundled server](#run-the-bundled-server)
  - [Deploy to Azure / any static host](#deploy-to-azure--any-static-host)
  - [Live demo URL mapping](#live-demo-url-mapping)
- [Configuration](#configuration)
- [Templates & field conventions](#templates--field-conventions)
- [Project architecture](#project-architecture)
- [License](#license)

---

## Features

- **8 predefined HR templates** built at runtime from TypeScript builders (onboarding form, employee information sheet, welcome letter, offer letter, NDA, asset request, benefits enrollment, background verification).
- **Word-style ribbon editor** powered by the Syncfusion EJ2 Document Editor (File / Home / Insert / Layout / References / Review / View / Developer tabs).
- **Floating field panel** that auto-discovers form fields in the document and renders the right control per field (text, date picker, phone mask, currency, dropdown, combo, checkbox, etc.).
- **Two-way doc ⇄ panel sync** — adding/removing a form field in the editor re-scans the panel; values and provenance are preserved across re-scans.
- **Record auto-fill** — pick a mock employee record and every field whose name matches a record key auto-fills, with correct formatting (dates → `MM/DD/YYYY`, salary → `$xx,xxx.xx`).
- **Per-field validation** layered on top of a required check (date, phone, email, ZIP, state, currency, percent, integer).
- **Mail merge** `«token»` support in prose paragraphs, filled from the bound field or the selected record.
- **Cohort ZIP export** — generate documents for multiple records at once and download them as a single archive.
- **DOCX + image-PDF export**, fully client-side.
- **In-app "New Template"** authoring mode (session only) plus a dev-only `?authoring=1` route for capturing SFDT.
- **Light/dark theme** with no flash on first paint.

---

## Repository layout

```
gitHUb/                 # repository root (this README)
└── React/              # the application (HR Doc Studio)
    ├── index.html
    ├── package.json
    ├── vite.config.ts
    ├── server.mjs      # production static-file server (sets the public base path)
    └── src/
        ├── App.tsx                 # app shell / orchestration
        ├── main.tsx
        ├── components/             # IconButton, GenerateMenu
        ├── data/                   # mock API, employees, dropdowns, template catalog
        ├── editor/                 # DocumentStage, fieldSync, exporters, mailMerge, zip
        ├── panel/                  # FieldPanel, FieldControl, validation, scan report
        ├── records/                # RecordGrid (employee record picker)
        ├── styles/                 # app.css, tokens.css, syncfusion.css(.dark)
        ├── templates/              # gallery, NewTemplateDialog, predefinedBuilders, authoring/
        ├── theme/                  # ThemeToggle, useTheme
        ├── types/                  # shared TypeScript types
        └── utils/
```

Everything runs client-side; `src/data/` mocks the backend.

---

## Tech stack

| | |
|---|---|
| Framework | React 18 + TypeScript 5.9 |
| Build tool | Vite 7 |
| Document editor | Syncfusion EJ2 React Document Editor (`@syncfusion/ej2-react-documenteditor` 34.2) |
| Other Syncfusion | grids, dropdowns, inputs, buttons, calendars, navigations, pdf-export |
| Routing | react-router-dom 7 |
| Icons | lucide-react |
| Archive | jszip |
| Production server | Node `http` static server (`server.mjs`) |

---

## Prerequisites

- **Node.js 18+** and npm
- A **Syncfusion Community License key** (optional but recommended — hides the trial banner). Get one free at <https://www.syncfusion.com/products/communitylicense>.

---

## Getting started (local dev)

```bash
cd React
npm install

# (optional) add a Syncfusion license key to hide the trial banner
#   echo "VITE_SF_LICENSE_KEY=xxxxxxxxxxxxxxxxxxxx" > .env.local

npm run dev            # opens http://localhost:5173
```

Other scripts:

```bash
npm run build          # tsc -b + vite build (outputs to React/dist)
npm run preview        # serve the production build via Vite
npm run start          # serve React/dist with the bundled server.mjs (PORT=5174 by default)
npx tsc --noEmit -p tsconfig.app.json   # type-check only
```

---

## Production build & deployment

The app is configured to be served from the sub-path `/intelligent-forms-doc-generation/react/`, which matches the public demo URL. Both Vite (`base` in `vite.config.ts`) and the bundled Node server (`publicPath` in `server.mjs`) are pre-configured for this, so a default build/deploy needs no path changes.

### Build

```bash
cd React
npm install
npm run build
```

This runs `tsc -b && vite build` and writes the static site to `React/dist`. The asset URLs in `dist/index.html` are already prefixed with `/intelligent-forms-doc-generation/react/`.

### Run the bundled server

`React/server.mjs` is a zero-dependency Node static server that redirects the site root to the React app and serves the build with the correct base path and React Router fallback:

```bash
cd React
npm run build
npm run start          # serves dist on http://0.0.0.0:5174
# or override the port:
# PORT=8080 npm run start
```

- Visiting `http://<host>:5174/` redirects (302) to `/intelligent-forms-doc-generation/react/`.
- Unknown HTML routes fall back to `index.html` (client-side routing); missing assets return a real 404.

### Deploy to Azure / any static host

Because the build is plain static files under `React/dist`, you can host it on any static host (Azure App Service, Azure Static Web Apps, Netlify, Vercel, Nginx, GitHub Pages with a sub-path, etc.).

**Using the bundled `server.mjs` (Node host, e.g. Azure App Service on Linux):**

1. Deploy the `React/` folder with `node_modules` installed and `dist/` built.
2. Set the start command to `node server.mjs` (or `npm run start`).
3. Set `PORT` to the port the platform exposes (default `5174`).
4. The server automatically redirects `/` → `/intelligent-forms-doc-generation/react/`.

**Using a static-only host (Azure Static Web Apps / CDN / Nginx):**

1. Publish the contents of `React/dist/` to the site root (or to a `/intelligent-forms-doc-generation/react/` virtual directory).
2. Configure the host to serve `index.html` as the SPA fallback for any path under the base.
3. No server-side code is required — everything is static.

### Live demo URL mapping

The public demo is served at:

```
https://showcase.syncfusion.com/intelligent-forms-doc-generation/
```

The React app itself is mounted under the `/react/` sub-path of that URL, so the assets resolve to `/intelligent-forms-doc-generation/react/...`. This matches the `base` set in `React/vite.config.ts` and the `publicPath` in `React/server.mjs` — no rewrite is needed for the standard deployment.

---

## Configuration

| Variable / file | Purpose |
|---|---|
| `VITE_SF_LICENSE_KEY` (env, build-time) | Syncfusion Community license key. Place in `React/.env.local` to hide the trial banner. **Do not commit this key.** |
| `vite.config.ts` → `base` | Public path the app is served from. Default `/intelligent-forms-doc-generation/react/`. Change only if deploying to a different sub-path. |
| `server.mjs` → `publicPath` | The bundled server's public path. Must match `base` above. |
| `server.mjs` → `PORT` (env) | Port for the Node server. Default `5174`. |
| `localStorage['hrdocstudio.theme']` | User theme preference (`light` / `dark` / `system`). |
| `sessionStorage['hrdocstudio.templates']` | Session-only "New Template" definitions (cleared on tab close). |

---

## Templates & field conventions

Predefined templates are **not** shipped as `.docx`/`.sfdt` files. Each is a small TypeScript builder function that draws the form at runtime using the live Document Editor's own APIs (`src/templates/authoring/build*.ts` + `builderKit.ts`). Editing the builder = editing the template; there is no regeneration step.

A field is added by calling `insertNamedField('Text' | 'CheckBox' | 'DropDown', '<name>', extra?)` inside a builder. The field's `name` then drives:

- **Auto-fill** — name the field exactly an `EmployeeRecord` key (`id`, `fullName`, `startDate`, `department`, …) and it fills when a record is picked.
- **Panel control** — `*date` → date picker, `*phone` → phone mask, `*email` → email input, `zip` → ZIP input, `*salary`/`*amount` → currency spinner, `*percent` → 0–100, `quantity` → integer, DropDown → dropdown, `*relationship` → editable combo, else plain text.
- **Validation** — mirrors the control mapping on top of a required check. Add optional fields to `OPTIONAL_FIELD_NAMES` in `src/panel/validation.ts`.

See `React/README.md` and `React/CLAUDE.md` for the full architecture, builder API, and known-gaps list.

---

## Project architecture

| Area | File(s) |
|---|---|
| App shell / orchestration | `src/App.tsx` |
| Editor wrapper (Word-style Ribbon) | `src/editor/DocumentStage.tsx` |
| Doc ⇄ panel two-way sync | `src/editor/fieldSync.ts`, `src/editor/useFormFields.ts` |
| Panel controls (per field kind) | `src/panel/FieldControl.tsx`, `src/panel/fieldControls.ts` |
| Per-field validation | `src/panel/validation.ts` |
| Mail-merge (`«token»`) + cohort ZIP | `src/editor/mailMerge.ts`, `src/editor/zip.ts` |
| DOCX / image-PDF export | `src/editor/exporters.ts` |
| Predefined templates | `src/templates/authoring/build*.ts`, `src/templates/authoring/builderKit.ts` |
| Template registry | `src/templates/predefinedBuilders.ts`, `src/data/templates.catalog.ts` |
| Mock "backend" data | `src/data/employees.ts`, `src/data/dropdowns.ts`, `src/data/mockApi.ts` |
| Employee record picker | `src/records/RecordGrid.tsx` |
| Theme | `src/theme/ThemeToggle.tsx`, `src/theme/useTheme.ts` |

Conventions and guardrails:

- **TypeScript strict.** No `any` for field/record models.
- Touch the Syncfusion editor **only** through `DocumentStage` / the `fieldSync` API — never query its DOM directly.
- Keep option lists and latency in `src/data/`; components never hardcode them.
- Keep field names aligned to `EmployeeRecord` keys so auto-fill keeps working.
- Do not add a backend, persistence, or auth. Do not commit the license key.

---

## License

This sample uses Syncfusion EJ2 components under the Syncfusion Community License. See <https://www.syncfusion.com/products/communitylicense> for terms. Sample source code in this repository is provided as-is for demonstration purposes.
