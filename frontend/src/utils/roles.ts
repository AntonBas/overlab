import type { HeroRole } from "../types/api";

export const ROLE_DESCRIPTIONS: Record<HeroRole, string> = {
  TANK: "Tanks absorb damage and create space so the team can take fights.",
  DAMAGE: "Damage heroes find, pressure and eliminate enemies.",
  SUPPORT: "Support heroes heal, protect and empower their team.",
};

export const SUBROLE_DESCRIPTIONS: Record<string, string> = {
  initiator: "Starts fights by diving in or pulling enemies out of position.",
  bruiser: "Fights up close, trading damage while staying hard to take down.",
  stalwart:
    "Anchors the team with strong defense and steady pressure from range.",
  recon: "Tracks enemies, gathers information and punishes from a distance.",
  flanker: "Fast and mobile, picks off isolated targets from behind the lines.",
  sharpshooter: "Precise long-range damage that removes priority targets.",
  specialist: "Unusual tools and mechanics that change how a fight plays out.",
  tactician: "Controls the fight with utility and timing to enable teammates.",
  medic: "Focuses on raw healing to keep teammates alive.",
  survivor: "Support that can protect itself and escape while still helping.",
};
