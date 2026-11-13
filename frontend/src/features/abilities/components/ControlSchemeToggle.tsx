import clsx from "clsx";
import {
  CONTROL_SCHEMES,
  CONTROL_SCHEME_LABELS,
  useControlScheme,
} from "../context/controlSchemeContext";

export function ControlSchemeToggle() {
  const { scheme, setScheme } = useControlScheme();
  return (
    <div className="segmented" role="group" aria-label="Controls">
      {CONTROL_SCHEMES.map((option) => (
        <button
          key={option}
          type="button"
          className={clsx("segmented__item", {
            "segmented__item--active": option === scheme,
          })}
          aria-pressed={option === scheme}
          onClick={() => setScheme(option)}
        >
          {CONTROL_SCHEME_LABELS[option]}
        </button>
      ))}
    </div>
  );
}
