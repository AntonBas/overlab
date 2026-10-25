import type { InputHTMLAttributes } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function FormField({
  label,
  error,
  hint,
  id,
  ...input
}: FormFieldProps) {
  const fieldId = id ?? `field-${input.name}`;
  return (
    <div className="form-field">
      <label htmlFor={fieldId}>{label}</label>
      <input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        {...input}
      />
      {hint && !error && <span className="muted">{hint}</span>}
      {error && (
        <span id={`${fieldId}-error`} className="form-field__error">
          {error}
        </span>
      )}
    </div>
  );
}
