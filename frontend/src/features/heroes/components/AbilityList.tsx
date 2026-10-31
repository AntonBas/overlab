import { Thumbnail } from "../../../components/ui/Thumbnail";
import type { Ability } from "../../../types/api";

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
            <strong>{ability.name}</strong>
            {ability.description && (
              <span className="muted">{ability.description}</span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
