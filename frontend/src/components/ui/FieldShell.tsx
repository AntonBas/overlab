import type { ReactNode } from "react";

interface FieldShellProps {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
}

export function FieldShell({
  id,
  label,
  error,
  hint,
  children,
}: FieldShellProps) {
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
