import { CheckBoxComponent } from '@syncfusion/ej2-react-buttons';
import { DatePickerComponent } from '@syncfusion/ej2-react-calendars';
import { ComboBoxComponent, DropDownListComponent } from '@syncfusion/ej2-react-dropdowns';
import { MaskedTextBoxComponent, NumericTextBoxComponent, TextBoxComponent } from '@syncfusion/ej2-react-inputs';
import type { FormFieldModel } from '@/types';
import { dateToUs, parseUsDate, toUsCurrency, toUsPhone } from '@/utils/format';
import { resolveControl } from './fieldControls';
import { OWNER_LABEL, type FieldOwner } from './fieldOwner';

interface FieldControlProps {
  field: FormFieldModel;
  onChange: (name: string, rawValue: string) => void;
  /** True while this field's dropdown options are still loading from the mock backend. */
  optionsLoading?: boolean;
  /** Who completes this field — renders an HR / Employee chip. */
  owner?: FieldOwner;
}

const STATE_CLASS: Record<FormFieldModel['source'], string> = {
  db: 'field--db',
  user: 'field--user',
  default: '',
};

/** Parses a stored string (which may carry `$`, `,`, `%`) into a number for the numeric spinners. */
function numFromString(value: string): number | undefined {
  if (value.trim() === '') return undefined;
  const n = Number(value.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : undefined;
}

/** One panel row: label + chip + the control resolved for the field (decoupled from doc kind). */
export function FieldControl({ field, onChange, optionsLoading, owner }: FieldControlProps) {
  const stateClass = [STATE_CLASS[field.source], !field.valid ? 'field--invalid' : ''].filter(Boolean).join(' ');
  const { control, options } = resolveControl(field);
  const id = `field-${field.name}`;

  return (
    <div className={`field-row ${stateClass}`}>
      <div className="field-row__header">
        <label className="field-row__label" htmlFor={id}>
          {field.label}
          {field.required && <span className="field-row__required">*</span>}
        </label>
        <div className="field-row__chips">
          {owner && <span className={`chip chip--owner-${owner}`}>{OWNER_LABEL[owner]}</span>}
          {field.wasAutoNamed && <span className="chip chip--auto">Auto-named</span>}
          {field.source === 'db' && <span className="chip chip--db">DB</span>}
          {field.source === 'user' && <span className="chip chip--user">Edited</span>}
        </div>
      </div>

      {control === 'date' && (
        <DatePickerComponent
          id={id}
          value={parseUsDate(field.value) ?? undefined}
          format="MM/dd/yyyy"
          placeholder="MM/DD/YYYY"
          strictMode
          enableMask
          maskPlaceholder={{ day: 'DD', month: 'MM', year: 'YYYY' }}
          width="100%"
          cssClass="field-row__datepicker"
          change={(e: { value?: Date | null }) => onChange(field.name, e.value ? dateToUs(e.value) : '')}
        />
      )}

      {control === 'phone' && (
        <MaskedTextBoxComponent
          id={id}
          mask="(000) 000-0000"
          value={field.value}
          // Commit on blur only (like the plain TextBox). MaskedTextBox fires `change` on
          // every accepted digit; wiring it here would re-render the controlled `value` mid
          // keystroke and Syncfusion would drop input focus. The mask still formats live
          // while typing — it just doesn't push to the model/doc until focus leaves.
          blur={(e: { value?: string; maskedValue?: string }) => {
            const digits = (e.value ?? '').replace(/\D/g, '');
            // toUsPhone formats a 10-digit string; a partial one is returned unchanged so
            // validation can flag it as incomplete.
            onChange(field.name, toUsPhone(digits));
          }}
        />
      )}

      {control === 'email' && (
        <TextBoxComponent
          id={id}
          type="email"
          value={field.value}
          change={(e) => onChange(field.name, e.value ?? '')}
        />
      )}

      {control === 'zip' && (
        <TextBoxComponent
          id={id}
          value={field.value}
          htmlAttributes={{ maxlength: '10' }}
          placeholder="12345 or 12345-6789"
          change={(e) => onChange(field.name, e.value ?? '')}
        />
      )}

      {control === 'currency' && (
        <NumericTextBoxComponent
          id={id}
          format="c0"
          min={0}
          value={numFromString(field.value)}
          change={(e: { value?: number | null }) =>
            onChange(field.name, e.value == null ? '' : toUsCurrency(Number(e.value)))
          }
        />
      )}

      {control === 'integer' && (
        <NumericTextBoxComponent
          id={id}
          format="n0"
          min={0}
          value={numFromString(field.value)}
          change={(e: { value?: number | null }) =>
            onChange(field.name, e.value == null ? '' : String(Math.trunc(Number(e.value))))
          }
        />
      )}

      {control === 'percent' && (
        <NumericTextBoxComponent
          id={id}
          format="n0"
          min={0}
          max={100}
          value={numFromString(field.value)}
          change={(e: { value?: number | null }) =>
            onChange(field.name, e.value == null ? '' : String(e.value))
          }
        />
      )}

      {control === 'combo' && (
        <ComboBoxComponent
          id={id}
          dataSource={options ?? []}
          value={field.value || undefined}
          allowCustom
          placeholder="Select or type…"
          change={(e) => onChange(field.name, e.value == null ? '' : String(e.value))}
        />
      )}

      {control === 'dropdown' && (
        <DropDownListComponent
          id={id}
          dataSource={options ?? []}
          value={field.value || undefined}
          placeholder={optionsLoading ? 'Loading options…' : 'Select…'}
          enabled={!optionsLoading}
          change={(e) => onChange(field.name, e.value == null ? '' : String(e.value))}
        />
      )}

      {control === 'checkbox' && (
        <CheckBoxComponent
          // Remounted on value change: CheckBoxComponent doesn't reliably re-sync its internal
          // checked state from a prop update alone, so a fresh instance keeps the visible box
          // and the "Yes"/"No" label from disagreeing.
          key={`${field.name}-${field.value}`}
          checked={field.value === 'true'}
          label={field.value === 'true' ? 'Yes' : 'No'}
          change={(e) => onChange(field.name, String(Boolean(e.checked)))}
        />
      )}

      {(control === 'text' || control === 'state') && (
        <TextBoxComponent id={id} value={field.value} change={(e) => onChange(field.name, e.value ?? '')} />
      )}

      {!field.valid && field.validationMessage && (
        <p className="field-row__message" role="alert">
          {field.validationMessage}
        </p>
      )}
    </div>
  );
}
