import { createContext, useContext } from "react";
import type { AbilityControl } from "../../../types/api";

export type ControlScheme = "PC" | "XBOX" | "PLAYSTATION" | "SWITCH";

export const CONTROL_SCHEMES: readonly ControlScheme[] = [
  "PC",
  "XBOX",
  "PLAYSTATION",
  "SWITCH",
];

export const CONTROL_SCHEME_LABELS: Record<ControlScheme, string> = {
  PC: "PC",
  XBOX: "Xbox",
  PLAYSTATION: "PlayStation",
  SWITCH: "Switch",
};

export const CONTROL_KEYS: Record<
  ControlScheme,
  Record<AbilityControl, string>
> = {
  PC: {
    PRIMARY_FIRE: "LMB",
    SECONDARY_FIRE: "RMB",
    ABILITY_1: "Shift",
    ABILITY_2: "E",
    ULTIMATE: "Q",
    JUMP: "Space",
    CROUCH: "Ctrl",
    PASSIVE: "",
  },
  XBOX: {
    PRIMARY_FIRE: "RT",
    SECONDARY_FIRE: "LT",
    ABILITY_1: "LB",
    ABILITY_2: "RB",
    ULTIMATE: "Y",
    JUMP: "A",
    CROUCH: "B",
    PASSIVE: "",
  },
  PLAYSTATION: {
    PRIMARY_FIRE: "R2",
    SECONDARY_FIRE: "L2",
    ABILITY_1: "L1",
    ABILITY_2: "R1",
    ULTIMATE: "Triangle",
    JUMP: "Cross",
    CROUCH: "Circle",
    PASSIVE: "",
  },
  SWITCH: {
    PRIMARY_FIRE: "ZR",
    SECONDARY_FIRE: "ZL",
    ABILITY_1: "L",
    ABILITY_2: "R",
    ULTIMATE: "X",
    JUMP: "B",
    CROUCH: "A",
    PASSIVE: "",
  },
};

export interface ControlSchemeState {
  scheme: ControlScheme;
  setScheme: (scheme: ControlScheme) => void;
}

export const ControlSchemeContext = createContext<ControlSchemeState>({
  scheme: "PC",
  setScheme: () => undefined,
});

export function useControlScheme(): ControlSchemeState {
  return useContext(ControlSchemeContext);
}
