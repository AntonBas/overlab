import { Link } from "react-router-dom";
import { HeroPortrait } from "../../../components/ui/HeroPortrait";
import { RoleBadge } from "../../../components/ui/RoleBadge";
import { AbilityText } from "./AbilityText";
import type { RelatedHero } from "../../../types/api";
import type { RelationKind } from "../api/relationFeedbackApi";
import type { RelationFeedback } from "../hooks/useRelationFeedback";
import { RelationVoteButtons } from "./RelationVoteButtons";

interface RelatedHeroesProps {
  heroes: RelatedHero[];
  type: RelationKind;
  feedback?: RelationFeedback;
}

export function RelatedHeroes({ heroes, type, feedback }: RelatedHeroesProps) {
  return (
    <ul className="card-list">
      {heroes.map((hero) => (
        <li key={hero.slug} className="card">
          <span className="card__icon">
            <HeroPortrait name={hero.name} url={hero.portraitUrl} size={40} />
          </span>
          <span className="card__body">
            <span className="card__title">
              <RoleBadge role={hero.role} compact />
              <Link to={`/heroes/${hero.slug}`}>
                <strong>{hero.name}</strong>
              </Link>
            </span>
            {hero.note && (
              <span className="muted">
                <AbilityText text={hero.note} />
              </span>
            )}
          </span>
          {feedback && (
            <RelationVoteButtons
              feedback={feedback}
              relatedHeroSlug={hero.slug}
              relatedHeroName={hero.name}
              type={type}
            />
          )}
        </li>
      ))}
    </ul>
  );
}
