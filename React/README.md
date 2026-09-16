# HR Doc Studio

A data-driven document/form application for HR workflows, built as a modern React web app on top of the **Syncfusion EJ2 Document Editor**. An operator picks an HR template, the app scans its form fields and binds them to a floating side panel, fills them manually or auto-fills from an employee record, validates, and generates a completed **DOCX** and **PDF** — all client-side, no backend.

> `CLAUDE.md` is the architecture source of truth. This README is the **how-to** for running the app and, most importantly, **adding and customizing templates and fields**.

---

## Quick start

```bash
npm install
# optional: put a Syncfusion Community license key in .env.local to hide the trial banner
#   VITE_SF_LICENSE_KEY=xxxxxxxxxxxxxxxxxxxx
npm run dev            # http://localhost:5173
npm run build          # tsc -b + vite build
npx tsc --noEmit -p tsconfig.app.json   # type-check only
```

Node 18+. Everything is mocked in-browser (`src/data/`); there is no server.

---

## How it fits together (30-second tour)

| Area | File(s) |
|---|---|
| App shell / orchestration | `src/App.tsx` |
| Editor wrapper (Word-style **Ribbon**) | `src/editor/DocumentStage.tsx` |
| Doc ⇄ panel two-way sync | `src/editor/fieldSync.ts`, `src/editor/useFormFields.ts` |
| Panel controls & which control per field | `src/panel/FieldControl.tsx`, `src/panel/fieldControls.ts` |
| Per-field validation | `src/panel/validation.ts` |
| Mail-merge (`«token»`) + cohort ZIP | `src/editor/mailMerge.ts` |
| DOCX / image-PDF export | `src/editor/exporters.ts` |
| **Predefined templates (built at runtime)** | `src/templates/authoring/build*.ts`, `src/templates/authoring/builderKit.ts` |
| Template registry | `src/templates/predefinedBuilders.ts`, `src/data/templates.catalog.ts` |
| Mock "backend" data | `src/data/employees.ts`, `src/data/dropdowns.ts`, `src/data/mockApi.ts` |

Predefined templates are **not** shipped as `.docx`/`.sfdt` files. Each one is a small TypeScript function that draws the form at runtime using the live Document Editor's own editing APIs (`src/templates/authoring/build*.ts`). Editing the builder = editing the template; there is no regeneration step.

---

## The editor ribbon

`DocumentStage.tsx` runs the container in **Ribbon** mode (`toolbarMode="Ribbon"`, `ribbonLayout="Simplified"`) — a single compact row of controls under the **File / Home / Insert / Layout / References / Review / View / Developer** tabs.

- The floating **field panel** is kept flush below the ribbon: `DocumentStage` measures the ribbon's bottom edge (`onChromeHeight`, via a `ResizeObserver`) and `App.tsx` writes it to the `--panel-top` CSS variable that `.field-panel` reads.
- `File ▸ New / Open` in the ribbon replaces the document and does **not** re-scan the field panel — that is deliberate Word-editor behavior. Use the app's own command bar (**← Templates**) to go back to the HR flow.
- For the two-row grouped ribbon, change `ribbonLayout` to `"Classic"` in `DocumentStage.tsx`.

---

## Two ways to create a template

| | **Predefined template** (code) | **New template** (in-app) |
|---|---|---|
| Where | `src/templates/authoring/buildXxx.ts` | "New Template" card in the gallery |
| Lifetime | Permanent, versioned in git | **Session only** — gone when the tab closes (`sessionStorage` key `hrdocstudio.templates`) |
| How you build it | TypeScript + `builderKit` helpers | Type/format in the Word ribbon; insert fields from the **Developer** tab |
| Auto-fill / validation / merge | Full — as long as field names follow the conventions below | Same rules apply — name your fields correctly |
| Use it for | The 8 shipped forms; anything you want to keep | Quick experiments, one-off documents |

### In-app "New Template" (session)

1. Gallery → **New Template** → give it a title/description. A blank document opens.
2. Type the document body using the ribbon (**Home** for fonts/styles, **Insert** for tables/images, **Layout** for page setup).
3. Insert bound form fields from **Developer ▸ Form Fields** (text, check box, drop-down). Then **right-click the field ▸ Properties** (or Developer ▸ Properties) and set its **name** — this is what binds it to the panel and to auto-fill. Follow the [field-name conventions](#field-name-conventions).
4. **The panel keeps itself in sync.** Adding or removing a form field in the editor re-scans the panel automatically (`fieldSync.rescan()` runs when the field list changes); if one ever fails to appear, open the **Field scan report** and hit **Rescan & re-validate**. A re-scan keeps values/provenance for fields that are still present.

> **Nothing you do in the editor is persisted.** Only a New Template's *initial blank* is written to `sessionStorage` (`hrdocstudio.templates`) — text you type, fields you add, and record auto-fills all live in memory for the session only, and are discarded on **Reset form**, on switching templates, and on tab close. A predefined template is re-built from its `build*.ts` source every time you open it. To keep a design, port it to a builder (below).

---

## Adding a predefined template (code)

### 1. Write the builder

Create `src/templates/authoring/buildMyForm.ts`:

```ts
import type { DocumentEditor, DropDownFormFieldInfo } from '@syncfusion/ej2-documenteditor';
import { dropdownOptions } from '@/data/dropdowns';
import { createBuilderKit, setDropdownDefaults } from './builderKit';

/**
 * My Form — one-line description of what it's for.
 */
export function buildMyForm(editor: DocumentEditor): void {
  const { letterhead, note, sectionBand, fieldTable, signatureLine, insertNamedField, footer } =
    createBuilderKit(editor);

  // shorthand for a drop-down form field
  const dd = (name: string, items: string[]) =>
    insertNamedField<DropDownFormFieldInfo>('DropDown', name, { dropdownItems: items });

  letterhead('My Form', 'Subtitle — Department');
  note('Instructions / disclaimer in small print.');

  sectionBand('Section 1');
  fieldTable([
    { label: 'Full Name',   build: () => insertNamedField('Text', 'fullName') },
    { label: 'Employee ID', build: () => insertNamedField('Text', 'id') },
    { label: 'Department',  build: () => dd('department', dropdownOptions.department) },
    { label: 'Start Date (MM/DD/YYYY)', build: () => insertNamedField('Text', 'startDate') },
    { label: 'I acknowledge the above', build: () => insertNamedField('CheckBox', 'acknowledgment') },
  ]);

  signatureLine('Employee Signature');           // static wet-signature rule, NOT a bound field
  setDropdownDefaults(editor, ['department']);    // select index 0 for these drop-downs
  footer('HR-MYF-01');                            // page footer + form id; call last
}
```

### 2. Register it

`src/templates/predefinedBuilders.ts`:

```ts
import { buildMyForm } from './authoring/buildMyForm';

export const PREDEFINED_BUILDERS = {
  // …existing…
  'my-form': buildMyForm,
};
```

### 3. Add the gallery card

`src/data/templates.catalog.ts`:

```ts
{
  id: 'my-form',
  builderId: 'my-form',                 // MUST match the PREDEFINED_BUILDERS key
  title: 'My Form',
  description: 'One line shown on the gallery card.',
  accent: 'sky',                        // indigo | teal | amber | rose | slate | sky | violet | emerald
  source: 'predefined',
  image: '/gallery/MyForm.png',         // optional; drop a PNG in public/gallery/. Omit → accent colour band
},
```

That's it — `npm run dev`, the card appears, clicking it builds the form and binds the panel.

### `builderKit` helpers

`createBuilderKit(editor)` returns:

| Helper | What it draws |
|---|---|
| `letterhead(title, subtitle?)` | Company wordmark + contact line + brand rule + centered title |
| `sectionBand(text)` | Full-width shaded section header |
| `fieldTable(rows)` | Aligned two-column **label \| field** grid. `rows: { label: string; build: () => void }[]` — the workhorse |
| `fieldRow(labelText, build)` | Inline bold label + field + line break (used for letter date lines, greetings) |
| `paragraph(text, { italic? })` | Body prose paragraph. Put `«tokens»` here for mail merge |
| `note(text)` | Small italic print (instructions, legal) |
| `signatureLine(who?)` | Static `Signature: ____  Date: ____` rule — **not** a form field |
| `footer(formId)` | Page footer: company · confidential · form id · page number. **Call last** |
| `heading` / `subheading` / `sectionTitle` / `blankLine` | Lower-level prose primitives |
| `insertNamedField(kind, name, extra?)` | Insert **and name** a form field. `kind`: `'Text' \| 'CheckBox' \| 'DropDown'`. For DropDown pass `{ dropdownItems: string[] }` in `extra` |
| `insertGenericNamedTextField()` | Insert an **unnamed** text field (keeps Syncfusion's `Text12` default) so it exercises the auto-identifier logic. **No shipped template uses this** — every field is named — but it's here for demoing the `Field_<kind>_N` auto-naming. |

`setDropdownDefaults(editor, names[])` sets each listed drop-down's selection to its first option (DropDown values are a numeric index, not a label — see `CLAUDE.md` §11).

---

## Adding / customizing a field

A field is added by calling `insertNamedField('Text' | 'CheckBox' | 'DropDown', '<name>', extra?)` inside a builder (usually as a `fieldTable` row). **Everything else — which panel control renders, which validation runs, whether it auto-fills, whether it merges — is driven entirely by the field's `name`.**

### Field-name conventions

**1. Auto-fill from an employee record** — name the field **exactly** an `EmployeeRecord` key and it fills when the operator picks a record:

```
id  fullName  firstName  lastName  email  department  designation  manager
location  addressLine1  addressLine2  city  state  zip  startDate  phone
employmentType  annualSalary
```

`mapRecordToFields()` handles formatting: `startDate` → `MM/DD/YYYY`, `annualSalary` → `$xx,xxx.xx`. Non-record fields (`approvedBy`, `costCenter`, `requestDate`, …) are simply left for the operator.

**2. Panel control** — `resolveControl()` (`src/panel/fieldControls.ts`) picks the control by `kind`, then by name:

| Field `kind` / name pattern | Panel control |
|---|---|
| `kind === 'CheckBox'` | check box (Yes/No) |
| `kind === 'DropDown'` | drop-down (`dropdownItems`, or runtime backend list — see below) |
| name ends `…relationship` | **editable combo box** (`Spouse`, `Parent`, … + free text) |
| name ends `…date` **or** contains `dateofbirth` | **date picker** (`MM/dd/yyyy`, masked) |
| name ends `…phone` | **phone mask** `(000) 000-0000` (commits on blur; pasting 10 digits auto-formats) |
| name ends `…email` | text input, `type=email` |
| name is exactly `zip` | text input, max 10 chars |
| name is exactly `state` | text input (usually a DropDown already) |
| name ends `…salary` or `…amount` | **currency spinner** `$` (`estimatedAmount`, `annualSalary`) |
| name ends `…percent` | **numeric 0–100** |
| name is exactly `quantity` | **integer spinner** |
| anything else | plain text input |

**3. Validation** — `ruleForField()` (`src/panel/validation.ts`) uses the **same** name conventions, so control and rule always agree: `*date` → `MM/DD/YYYY`, `*phone` → `(XXX) XXX-XXXX`, `*email` → email, `zip` → ZIP/ZIP+4, `state` → 2-letter code, `*salary`/`*amount` → currency, `*percent` → 0–100, `quantity` → whole number. All rules are **layered on top of a required check**.
  - Named fields are **required** by default. To make one optional, add it to `OPTIONAL_FIELD_NAMES` in `validation.ts`.
  - Any field whose name ends `…signature`, plus the signed-date names in `OPTIONAL_FIELD_NAMES`, **never block generation** (a wet signature is added on paper).
  - Fields inserted with `insertGenericNamedTextField()` are auto-named `Field_Text_N`, marked "auto-named" in the panel, and are **not** forced required.

**4. Drop-down options.** Two ways:
  - **Static** — pass them at build time: `dd('coverageTier', ['Employee Only', 'Family', …])`.
  - **Runtime "backend"** — for lists that should load async from the mock API (visible latency), add the field name → catalog key in `FIELD_TO_DROPDOWN_KEY` (`src/data/dropdowns.ts`). Existing wired keys: `department`, `designation`, `location`, `employmentType`, `state → usState`, `assetType`. The panel shows "Loading options…" then swaps in the list; the field is also re-populated in the document.

**5. `«token»` mail merge (prose).** Put `«fieldName»` in `paragraph()` text (e.g. `paragraph('Dear «fullName», …')` — though both letter greetings are now bound fields). On **Generate** the token is replaced by the current field value, or by the selected record's column when a record was picked (so a token with no bound field — the Welcome Letter's `«manager»` — still fills). The merge is non-destructive: the template is restored right after export. See `mailMerge.ts` (`applyMailMerge`, `tokensFromFields`, `tokensForRecord`).

### Worked examples

```ts
// Auto-fills from record.startDate as 09/21/2026, renders a date picker, validates MM/DD/YYYY:
{ label: 'Start Date (MM/DD/YYYY)', build: () => insertNamedField('Text', 'startDate') }

// Currency spinner, validates "$95,000" / "95000"; no record backing → operator enters it:
{ label: 'Estimated Cost (USD)', build: () => insertNamedField('Text', 'estimatedAmount') }

// Editable combo (list + free text), required unless added to OPTIONAL_FIELD_NAMES:
{ label: 'Relationship', build: () => insertNamedField('Text', 'emergencyContactRelationship') }

// Runtime-populated drop-down (add `myList: 'assetType'` style entry to FIELD_TO_DROPDOWN_KEY if new):
{ label: 'Asset Type', build: () => dd('assetType', dropdownOptions.assetType) }

// Never blocks Generate (ends with "signature"); stays blank for a wet signature:
{ label: 'Reviewer Signature', build: () => insertNamedField('Text', 'reviewerSignature') }
```

### Adding a brand-new semantic field type (e.g. a `…url` control)

1. `src/panel/fieldControls.ts` — add `'url'` to `ControlKind` and a `name.endsWith('url')` branch in `resolveControl`.
2. `src/panel/FieldControl.tsx` — render a control for `control === 'url'` (call `onChange(field.name, value)` with a plain string).
3. `src/panel/validation.ts` — add a `urlRule` and a `lower.endsWith('url')` branch in `ruleForField`.
4. Name your builder field `…Url` and it picks all three up.

---

## Adding mock data

- **Employee records** (the grid + auto-fill): append to `employees` in `src/data/employees.ts`. Keep every `EmployeeRecord` key filled; `startDate` is ISO (`yyyy-MM-dd`), `phone` is `(XXX) XXX-XXXX`, `state` is a 2-letter code.
- **Drop-down option lists**: edit `dropdownOptions` in `src/data/dropdowns.ts`. To expose a list to a field at runtime, also add the `fieldName → key` entry to `FIELD_TO_DROPDOWN_KEY`.
- **Latency**: `src/data/mockApi.ts` (`latency()` — 300–600 ms) so async behavior is visible.

---

## Conventions & guardrails

- **TypeScript strict.** No `any` for field/record models; model through `src/types`.
- Touch the Syncfusion editor **only** through `DocumentStage` / the `fieldSync` API — never query its DOM.
- Keep option lists and latency in `src/data/`; components never hardcode them.
- Keep field names aligned to `EmployeeRecord` keys so auto-fill keeps working.
- After any change to editor / panel / sync / export code, walk the golden path: pick a template → panel binds → pick a record → auto-fill → fix invalid fields → Generate DOCX + PDF.
- Do not add a backend, persistence, or auth. Do not commit the license key.

See `CLAUDE.md` for the full architecture, decisions, and the known-gaps list.
