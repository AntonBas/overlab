import { Link } from "react-router-dom";
import { Thumbnail } from "../../../components/ui/Thumbnail";
import { Tooltip } from "../../../components/ui/Tooltip";
import type { Ability } from "../../../types/hero";
import { formatAbilityDescription } from "../utils/abilityDescription";
import { AbilityKey } from "./AbilityKey";

export function AbilityChip({ ability }: { ability: Ability }) {
  return (
    <Tooltip
      interactive
      role="dialog"
      label={`${ability.heroName}: ${ability.name}`}
      gap={0}
      triggerClassName="ability-chip"
      tipClassName="ability-chip__tip"
      openTipClassName="ability-chip__tip--open"
      content={
        <>
          <span className="ability-chip__header">
            <Thumbnail
              url={ability.heroPortraitUrl}
              width={36}
              height={36}
              className="ability-chip__owner-portrait"
            />
            <span className="ability-chip__title">
              <Link
                className="ability-chip__owner"
                to={`/heroes/${ability.heroSlug}`}
              >
                {ability.heroName}
              </Link>
              <strong>{ability.name}</strong>
            </span>
            <AbilityKey control={ability.control} />
          </span>
          {ability.description && (
            <span>{formatAbilityDescription(ability.description)}</span>
          )}
        </>
      }
    >
      {({ describedBy }) => (
        <span
          className="ability-chip__button"
          tabIndex={0}
          aria-describedby={describedBy}
        >
          <Thumbnail
            url={ability.iconUrl}
            width={20}
            height={20}
            className="ability-chip__icon"
          />
          {ability.name}
        </span>
      )}
    </Tooltip>
  );
}
