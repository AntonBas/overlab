import { Eye, EyeOff } from "lucide-react";
import { useState, type InputHTMLAttributes } from "react";
import "./ui.css";

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
  type,
  ...input
}: FormFieldProps) {
  const fieldId = id ?? `field-${input.name}`;
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === "password";
  const inputElement = (
    <input
      id={fieldId}
      type={isPassword && revealed ? "text" : type}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${fieldId}-error` : undefined}
      {...input}
    />
  );
  return (
    <div className="form-field">
      <label htmlFor={fieldId}>{label}</label>
      {isPassword ? (
        <div className="form-field__control">
          {inputElement}
          <button
            type="button"
            className="form-field__toggle"
            aria-label={revealed ? "Hide password" : "Show password"}
            aria-pressed={revealed}
            onClick={() => setRevealed((current) => !current)}
          >
            {revealed ? (
              <EyeOff aria-hidden="true" size={18} />
            ) : (
              <Eye aria-hidden="true" size={18} />
            )}
          </button>
        </div>
      ) : (
        inputElement
      )}
      {hint && !error && <span className="muted">{hint}</span>}
      {error && (
        <span id={`${fieldId}-error`} className="form-field__error">
          {error}
        </span>
      )}
    </div>
  );
}
