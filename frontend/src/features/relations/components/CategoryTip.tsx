import { Link } from "react-router-dom";
import { HeroPortrait } from "../../../components/ui/HeroPortrait";
import type { CategoryMatchup, HeroCategory } from "../../../types/hero";
import { AbilityText } from "../../abilities";

interface CategoryTipProps {
  category: HeroCategory;
  matchup?: CategoryMatchup;
}

export function CategoryTip({ category, matchup }: CategoryTipProps) {
  const note = matchup?.note ?? category.description;
  return (
    <>
      <span className="perk-tip__header">
        <span className="perk-tip__title">
          <strong>{category.name}</strong>
        </span>
      </span>
      {note && (
        <span className="perk-tip__text">
          <AbilityText text={note} />
        </span>
      )}
      <span className="category-tip__heroes">
        {category.heroes.map((hero) => (
          <Link
            key={hero.slug}
            className="category-tip__hero"
            to={`/heroes/${hero.slug}`}
          >
            <HeroPortrait name={hero.name} url={hero.portraitUrl} size={32} />
            {hero.name}
          </Link>
        ))}
      </span>
    </>
  );
}
