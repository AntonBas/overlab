import { Thumbnail } from "../../../components/ui/Thumbnail";
import { Tooltip } from "../../../components/ui/Tooltip";
import type { Ability } from "../../../types/hero";
import { formatAbilityDescription } from "../utils/abilityDescription";
import { AbilityKey } from "./AbilityKey";

export function AbilityChip({ ability }: { ability: Ability }) {
  return (
    <Tooltip
      gap={0}
      triggerClassName="ability-chip"
      tipClassName="ability-chip__tip"
      openTipClassName="ability-chip__tip--open"
      content={
        <>
          <strong>{ability.name}</strong>
          <AbilityKey control={ability.control} showLabel />
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
