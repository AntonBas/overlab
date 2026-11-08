import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import "../../admin.css";

interface FieldShellProps {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
}

function FieldShell({ id, label, error, hint, children }: FieldShellProps) {
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && !error && <span className="muted">{hint}</span>}
      {error && (
        <span id={`${id}-error`} className="form-field__error">
          {error}
        </span>
      )}
    </div>
  );
}

interface CommonProps {
  label: string;
  error?: string;
  hint?: ReactNode;
}

export function TextAreaField({
  label,
  error,
  hint,
  id,
  ...input
}: CommonProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const fieldId = id ?? `field-${input.name}`;
  return (
    <FieldShell id={fieldId} label={label} error={error} hint={hint}>
      <textarea
        id={fieldId}
        rows={4}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        {...input}
      />
    </FieldShell>
  );
}

export function SelectField({
  label,
  error,
  hint,
  id,
  children,
  ...input
}: CommonProps & SelectHTMLAttributes<HTMLSelectElement>) {
  const fieldId = id ?? `field-${input.name}`;
  return (
    <FieldShell id={fieldId} label={label} error={error} hint={hint}>
      <select
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        {...input}
      >
        {children}
      </select>
    </FieldShell>
  );
}

export function CheckboxField({
  label,
  hint,
  id,
  ...input
}: Omit<CommonProps, "error"> &
  Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const fieldId = id ?? `field-${input.name}`;
  return (
    <div className="form-field form-field--checkbox">
      <label htmlFor={fieldId}>
        <input id={fieldId} type="checkbox" {...input} />
        {label}
      </label>
      {hint && <span className="muted">{hint}</span>}
    </div>
  );
}
