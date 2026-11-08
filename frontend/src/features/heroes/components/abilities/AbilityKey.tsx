import clsx from "clsx";
import type { AbilityControl } from "../../../../types/api";
import {
  CONTROL_KEYS,
  CONTROL_SCHEME_LABELS,
  useControlScheme,
} from "../../context/controlSchemeContext";
import { ABILITY_CONTROL_LABELS } from "../../utils/abilityControls";
import { ControlGlyph } from "./ControlGlyph";
import "../../heroes.css";

export function AbilityKey({
  control,
  showLabel = false,
}: {
  control: AbilityControl | null;
  showLabel?: boolean;
}) {
  const { scheme } = useControlScheme();
  if (!control) {
    return null;
  }
  const key = CONTROL_KEYS[scheme][control];
  const label = ABILITY_CONTROL_LABELS[control];
  const title = key
    ? `${label} (${key} on ${CONTROL_SCHEME_LABELS[scheme]} by default)`
    : label;
  return (
    <span
      className={clsx("ability-key", `ability-key--${control.toLowerCase()}`)}
      title={title}
    >
      {key && (
        <kbd className="ability-key__cap">
          <ControlGlyph scheme={scheme} name={key} />
        </kbd>
      )}
      {(showLabel || !key) && (
        <span className="ability-key__label">{label}</span>
      )}
    </span>
  );
}
