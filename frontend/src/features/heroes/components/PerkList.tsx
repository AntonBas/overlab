import clsx from "clsx";
import type { Perk, PerkRecommendation, PerkSlot } from "../../../types/api";

const SLOT_ORDER: PerkSlot[] = ["MAJOR", "MINOR"];
const SLOT_LABELS: Record<PerkSlot, string> = {
  MAJOR: "Major perks",
  MINOR: "Minor perks",
};
const RECOMMENDATION_LABELS: Record<PerkRecommendation, string> = {
  RECOMMENDED: "Recommended",
  OPTIONAL: "Optional",
  AVOID: "Avoid",
};

export function PerkList({ perks }: { perks: Perk[] }) {
  return (
    <>
      {SLOT_ORDER.map((slot) => {
        const group = perks.filter((perk) => perk.slot === slot);
        if (group.length === 0) {
          return null;
        }
        return (
          <div key={slot} className="perk-group">
            <h3>{SLOT_LABELS[slot]}</h3>
            <ul className="card-list">
              {group.map((perk) => (
                <li key={perk.id} className="card">
                  <span className="card__body">
                    <strong>{perk.name}</strong>
                    {perk.description && (
                      <span className="muted">{perk.description}</span>
                    )}
                    {perk.recommendationNote && (
                      <span>{perk.recommendationNote}</span>
                    )}
                  </span>
                  <span
                    className={clsx(
                      "tag",
                      `tag--${perk.recommendation.toLowerCase()}`,
                    )}
                  >
                    {RECOMMENDATION_LABELS[perk.recommendation]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </>
  );
}
