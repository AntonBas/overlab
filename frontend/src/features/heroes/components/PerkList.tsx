import { NewBadge } from "../../../components/ui/NewBadge";
import clsx from "clsx";
import { useId } from "react";
import { createPortal } from "react-dom";
import { Thumbnail } from "../../../components/ui/Thumbnail";
import { useFloatingTip } from "../../../hooks/useFloatingTip";
import type {
  Perk,
  PerkPosition,
  PerkRecommendation,
  PerkSlot,
} from "../../../types/api";
import { AbilityText } from "./AbilityText";

const SLOT_ORDER: PerkSlot[] = ["MINOR", "MAJOR"];
const SLOT_LABELS: Record<PerkSlot, string> = {
  MINOR: "Minor perks",
  MAJOR: "Major perks",
};
const POSITION_LABELS: Record<PerkPosition, string> = {
  LEFT: "Left perk",
  RIGHT: "Right perk",
};
const POSITION_ORDER: PerkPosition[] = ["LEFT", "RIGHT"];
const RECOMMENDATION_LABELS: Record<PerkRecommendation, string> = {
  RECOMMENDED: "Recommended",
  OPTIONAL: "Optional",
  AVOID: "Avoid",
};

function positionOf(perk: Perk): PerkPosition {
  return perk.position ?? "LEFT";
}

function PerkCard({ perk }: { perk: Perk }) {
  const position = positionOf(perk);
  return (
    <li
      className={clsx(
        "perk-card",
        `perk-card--${position.toLowerCase()}`,
        `perk-card--${perk.recommendation.toLowerCase()}`,
      )}
    >
      <span className="perk-card__header">
        <span className="perk-card__side muted">
          {POSITION_LABELS[position]}
        </span>
        <span
          className={clsx("tag", `tag--${perk.recommendation.toLowerCase()}`)}
        >
          {RECOMMENDATION_LABELS[perk.recommendation]}
        </span>
      </span>
      <span className="perk-card__main">
        <Thumbnail
          url={perk.iconUrl}
          width={56}
          height={56}
          className="perk-card__icon"
        />
        <span className="card__body">
          <strong>{perk.name}</strong>
          {perk.recentlyAdded && <NewBadge />}
          {perk.description && (
            <span className="muted">{perk.description}</span>
          )}
          {perk.recommendationNote && (
            <span className="perk-card__note">
              <AbilityText text={perk.recommendationNote} />
            </span>
          )}
        </span>
      </span>
    </li>
  );
}

function CompactPerkTile({ perk }: { perk: Perk }) {
  const position = positionOf(perk);
  const tipId = useId();
  const { open, style, triggerRef, tipRef, triggerProps, tipProps } =
    useFloatingTip();
  const hasTip = Boolean(perk.description || perk.recommendationNote);
  return (
    <li
      data-tip-anchor
      className={clsx(
        "perk-tile",
        `perk-card--${position.toLowerCase()}`,
        `perk-card--${perk.recommendation.toLowerCase()}`,
      )}
    >
      <span
        className="perk-tile__trigger"
        ref={triggerRef}
        tabIndex={hasTip ? 0 : undefined}
        aria-describedby={hasTip ? tipId : undefined}
        {...(hasTip ? triggerProps : {})}
      >
        <Thumbnail
          url={perk.iconUrl}
          width={44}
          height={44}
          className="perk-tile__icon"
        />
        <span className="perk-tile__body">
          <span className="perk-tile__heading">
            <strong>{perk.name}</strong>
            {perk.recentlyAdded && <NewBadge />}
            <span
              className={clsx(
                "tag",
                `tag--${perk.recommendation.toLowerCase()}`,
              )}
            >
              {RECOMMENDATION_LABELS[perk.recommendation]}
            </span>
          </span>
        </span>
      </span>
      {hasTip &&
        open &&
        createPortal(
          <span
            id={tipId}
            role="tooltip"
            ref={tipRef}
            className={clsx(
              "perk-tip",
              "perk-tip--interactive",
              `perk-tip--${perk.recommendation.toLowerCase()}`,
            )}
            style={style}
            {...tipProps}
          >
            <span className="perk-tip__header">
              <Thumbnail
                url={perk.iconUrl}
                width={36}
                height={36}
                className="perk-tip__icon"
              />
              <span className="perk-tip__title">
                <strong>{perk.name}</strong>
                {perk.recentlyAdded && <NewBadge />}
                <span
                  className={clsx(
                    "tag",
                    `tag--${perk.recommendation.toLowerCase()}`,
                  )}
                >
                  {RECOMMENDATION_LABELS[perk.recommendation]}
                </span>
              </span>
            </span>
            {perk.description && (
              <span className="perk-tip__text">{perk.description}</span>
            )}
            {perk.recommendationNote && (
              <span className="perk-tip__note">
                <span className="perk-tip__label">Why this rating</span>
                <AbilityText text={perk.recommendationNote} />
              </span>
            )}
          </span>,
          document.body,
        )}
    </li>
  );
}

export function PerkList({
  perks,
  compact = false,
}: {
  perks: Perk[];
  compact?: boolean;
}) {
  return (
    <>
      {SLOT_ORDER.map((slot) => {
        const group = POSITION_ORDER.flatMap((position) =>
          perks.filter(
            (perk) => perk.slot === slot && positionOf(perk) === position,
          ),
        );
        if (group.length === 0) {
          return null;
        }
        return (
          <div key={slot} className="perk-group">
            <h3>{SLOT_LABELS[slot]}</h3>
            <ul className={clsx("perk-row", { "perk-row--compact": compact })}>
              {group.map((perk) =>
                compact ? (
                  <CompactPerkTile key={perk.id} perk={perk} />
                ) : (
                  <PerkCard key={perk.id} perk={perk} />
                ),
              )}
            </ul>
          </div>
        );
      })}
    </>
  );
}
