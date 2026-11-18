import { Lightbulb, MapPin, Wrench, Zap, type LucideIcon } from "lucide-react";
import type { GuideKind, GuideSide } from "../../types/guide";

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

export const GUIDE_KIND_ICONS: Record<GuideKind, LucideIcon> = {
  SETUP: Wrench,
  POSITION: MapPin,
  ULTIMATE: Zap,
  TIP: Lightbulb,
};
