import { Eye, EyeOff } from "lucide-react";
import { useState, type InputHTMLAttributes } from "react";
import { FieldShell } from "./FieldShell";

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
    <FieldShell id={fieldId} label={label} error={error} hint={hint}>
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
    </FieldShell>
  );
}
