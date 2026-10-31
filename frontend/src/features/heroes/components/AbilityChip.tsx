import { useId } from "react";
import { Thumbnail } from "../../../components/ui/Thumbnail";
import type { Ability } from "../../../types/api";

export function AbilityChip({ ability }: { ability: Ability }) {
  const tipId = useId();

  return (
    <span className="ability-chip">
      <button
        type="button"
        className="ability-chip__button"
        aria-describedby={tipId}
      >
        <Thumbnail
          url={ability.iconUrl}
          width={20}
          height={20}
          className="ability-chip__icon"
        />
        {ability.name}
      </button>
      <span id={tipId} role="tooltip" className="ability-chip__tip">
        <strong>{ability.name}</strong>
        {ability.description && <span>{ability.description}</span>}
      </span>
    </span>
  );
}
