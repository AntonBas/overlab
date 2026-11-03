import type { AbilityControl } from "../../../types/api";

export const ABILITY_CONTROLS: readonly AbilityControl[] = [
  "PRIMARY_FIRE",
  "SECONDARY_FIRE",
  "ABILITY_1",
  "ABILITY_2",
  "ULTIMATE",
  "JUMP",
  "CROUCH",
  "PASSIVE",
];

export const ABILITY_CONTROL_LABELS: Record<AbilityControl, string> = {
  PRIMARY_FIRE: "Primary fire",
  SECONDARY_FIRE: "Secondary fire",
  ABILITY_1: "Ability 1",
  ABILITY_2: "Ability 2",
  ULTIMATE: "Ultimate",
  JUMP: "Jump",
  CROUCH: "Crouch",
  PASSIVE: "Passive",
};
