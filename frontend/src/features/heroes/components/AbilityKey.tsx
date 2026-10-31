import clsx from "clsx";
import type { AbilityControl } from "../../../types/api";
import {
  CONTROL_KEYS,
  CONTROL_SCHEME_LABELS,
  useControlScheme,
} from "../context/controlSchemeContext";

const CONTROL_LABELS: Record<AbilityControl, string> = {
  PRIMARY_FIRE: "Primary fire",
  SECONDARY_FIRE: "Secondary fire",
  ABILITY_1: "Ability 1",
  ABILITY_2: "Ability 2",
  ULTIMATE: "Ultimate",
  PASSIVE: "Passive",
};

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
  const label = CONTROL_LABELS[control];
  const title = key
    ? `${label} (${key} on ${CONTROL_SCHEME_LABELS[scheme]} by default)`
    : label;
  return (
    <span
      className={clsx("ability-key", `ability-key--${control.toLowerCase()}`)}
      title={title}
    >
      {key && <kbd className="ability-key__cap">{key}</kbd>}
      {(showLabel || !key) && (
        <span className="ability-key__label">{label}</span>
      )}
    </span>
  );
}
