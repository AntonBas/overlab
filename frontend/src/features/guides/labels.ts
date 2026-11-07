import type { GuideKind, GuideSide } from "../../types/api";

export const GUIDE_KIND_LABELS: Record<GuideKind, string> = {
  SETUP: "Setup",
  POSITION: "Position",
  ULTIMATE: "Ultimate spot",
  TIP: "Tip",
};

export const GUIDE_SIDE_LABELS: Record<GuideSide, string> = {
  ATTACK: "Attack",
  DEFENSE: "Defense",
  BOTH: "Both sides",
};

export const GUIDE_KINDS = Object.keys(GUIDE_KIND_LABELS) as GuideKind[];
export const GUIDE_SIDES = Object.keys(GUIDE_SIDE_LABELS) as GuideSide[];
