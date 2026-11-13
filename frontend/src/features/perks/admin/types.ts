import type {
  PerkPosition,
  PerkRecommendation,
  PerkSlot,
} from "../../../types/hero";

export interface PerkPayload {
  heroSlug: string;
  name: string;
  description: string | null;
  slot: PerkSlot;
  position: PerkPosition;
  recommendation: PerkRecommendation;
  recommendationNote: string | null;
}
