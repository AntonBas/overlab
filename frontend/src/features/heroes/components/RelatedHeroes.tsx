import { Link } from "react-router-dom";
import { RoleBadge } from "../../../components/ui/RoleBadge";
import type { RelatedHero } from "../../../types/api";

function Strength({ value }: { value: number }) {
  return (
    <span
      className="strength"
      role="img"
      aria-label={`Strength ${value} of 3`}
      title={`Strength ${value} of 3`}
    >
      {[1, 2, 3].map((pip) => (
        <span
          key={pip}
          className={
            pip <= value ? "strength__pip strength__pip--on" : "strength__pip"
          }
        />
      ))}
    </span>
  );
}

export function RelatedHeroes({ heroes }: { heroes: RelatedHero[] }) {
  return (
    <ul className="card-list">
      {heroes.map((hero) => (
        <li key={hero.slug} className="card">
          <span className="card__body">
            <span className="card__title">
              <RoleBadge role={hero.role} compact />
              <Link to={`/heroes/${hero.slug}`}>
                <strong>{hero.name}</strong>
              </Link>
            </span>
            {hero.note && <span className="muted">{hero.note}</span>}
          </span>
          <Strength value={hero.strength} />
        </li>
      ))}
    </ul>
  );
}
