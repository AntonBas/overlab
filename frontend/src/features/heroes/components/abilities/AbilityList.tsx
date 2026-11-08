import { NewBadge } from "../../../../components/ui/NewBadge";
import { Thumbnail } from "../../../../components/ui/Thumbnail";
import type { Ability } from "../../../../types/api";
import { AbilityKey } from "./AbilityKey";
import "../../heroes.css";

export function AbilityList({ abilities }: { abilities: Ability[] }) {
  return (
    <ul className="ability-list">
      {abilities.map((ability) => (
        <li key={ability.slug} className="ability-list__item">
          <Thumbnail
            url={ability.iconUrl}
            width={48}
            height={48}
            className="ability-list__icon"
          />
          <span className="card__body">
            <span className="ability-list__title">
              <strong>{ability.name}</strong>
              {ability.recentlyAdded && <NewBadge />}
              <AbilityKey control={ability.control} showLabel />
            </span>
            {ability.description && (
              <span className="muted">{ability.description}</span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
