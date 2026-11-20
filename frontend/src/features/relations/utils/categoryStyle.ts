import {
  CirclePlus,
  Crosshair,
  Hand,
  HeartOff,
  HeartPulse,
  Plane,
  RadioTower,
  Radar,
  Rocket,
  Shield,
  ShieldAlert,
  ShieldHalf,
  ShieldOff,
  Skull,
  Sparkles,
  Swords,
  Syringe,
  Tag,
  Undo2,
  Waves,
  Wind,
  Zap,
  type LucideIcon,
} from "lucide-react";

export type CategoryGroup =
  "playstyle" | "movement" | "durability" | "healing" | "special" | "other";

interface CategoryStyle {
  icon: LucideIcon;
  group: CategoryGroup;
}

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  dive: { icon: Rocket, group: "playstyle" },
  brawl: { icon: Swords, group: "playstyle" },
  poke: { icon: Crosshair, group: "playstyle" },
  "tank-poke": { icon: ShieldAlert, group: "playstyle" },
  stationary: { icon: RadioTower, group: "playstyle" },
  flyer: { icon: Plane, group: "movement" },
  escape: { icon: Wind, group: "movement" },
  "big-shield": { icon: Shield, group: "durability" },
  "small-shield": { icon: ShieldHalf, group: "durability" },
  "self-sustain": { icon: HeartPulse, group: "durability" },
  "heal-beam": { icon: Zap, group: "healing" },
  "heal-aoe": { icon: CirclePlus, group: "healing" },
  "heal-ranged": { icon: Syringe, group: "healing" },
  "anti-shield": { icon: ShieldOff, group: "special" },
  "anti-heal": { icon: HeartOff, group: "special" },
  "anti-air": { icon: Radar, group: "special" },
  "anti-projectile": { icon: Undo2, group: "special" },
  "beam-melee": { icon: Waves, group: "special" },
  control: { icon: Hand, group: "special" },
  cleanse: { icon: Sparkles, group: "special" },
  headshot: { icon: Skull, group: "special" },
};

export const CATEGORY_GROUP_LABELS: Record<CategoryGroup, string> = {
  playstyle: "Playstyle",
  movement: "Movement",
  durability: "Durability",
  healing: "Healing",
  special: "Special",
  other: "Category",
};

const FALLBACK_STYLE: CategoryStyle = { icon: Tag, group: "other" };

export function categoryStyleOf(slug: string): CategoryStyle {
  return CATEGORY_STYLES[slug] ?? FALLBACK_STYLE;
}

export const KNOWN_CATEGORY_SLUGS = Object.keys(CATEGORY_STYLES);
