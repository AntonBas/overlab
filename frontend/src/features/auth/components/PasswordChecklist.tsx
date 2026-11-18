import { Check, Circle, CircleAlert } from "lucide-react";

const MIN_LENGTH = 8;
const MAX_BYTES = 72;

interface PasswordChecklistProps {
  password: string;
  confirmation: string;
}

export function PasswordChecklist({
  password,
  confirmation,
}: PasswordChecklistProps) {
  const tooLong = new TextEncoder().encode(password).length > MAX_BYTES;
  const requirements = [
    { label: "At least 8 characters", met: password.length >= MIN_LENGTH },
    {
      label: "Passwords match",
      met: password.length > 0 && password === confirmation,
    },
  ];
  return (
    <ul className="password-checklist" aria-label="Password requirements">
      {requirements.map((requirement) => (
        <li
          key={requirement.label}
          className={
            requirement.met
              ? "password-checklist__item password-checklist__item--met"
              : "password-checklist__item"
          }
        >
          {requirement.met ? (
            <Check size={14} aria-hidden="true" />
          ) : (
            <Circle size={14} aria-hidden="true" />
          )}
          {requirement.label}
          <span className="visually-hidden">
            {requirement.met ? " (met)" : " (not met yet)"}
          </span>
        </li>
      ))}
      {tooLong && (
        <li
          className="password-checklist__item password-checklist__item--problem"
          role="alert"
        >
          <CircleAlert size={14} aria-hidden="true" />
          Password is too long. Use fewer characters (letters outside A-Z count
          double).
        </li>
      )}
    </ul>
  );
}
