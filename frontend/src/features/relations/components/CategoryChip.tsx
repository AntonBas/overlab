import clsx from "clsx";
import { Link } from "react-router-dom";
import { HeroPortrait } from "../../../components/ui/HeroPortrait";
import { Tooltip } from "../../../components/ui/Tooltip";
import type { CategoryMatchup, HeroCategory } from "../../../types/hero";
import { AbilityText } from "../../abilities";

interface CategoryChipProps {
  category: HeroCategory;
  matchup: CategoryMatchup;
}

export function CategoryChip({ category, matchup }: CategoryChipProps) {
  return (
    <li>
      <Tooltip
        interactive
        mount="open"
        role="dialog"
        label={`${category.name}: heroes`}
        tipClassName="perk-tip perk-tip--interactive category-tip"
        content={
          <>
            <span className="perk-tip__header">
              <span className="perk-tip__title">
                <strong>{category.name}</strong>
              </span>
            </span>
            {(matchup.note ?? category.description) && (
              <span className="perk-tip__text">
                <AbilityText
                  text={matchup.note ?? category.description ?? ""}
                />
              </span>
            )}
            <span className="category-tip__heroes">
              {category.heroes.map((hero) => (
                <Link
                  key={hero.slug}
                  className="category-tip__hero"
                  to={`/heroes/${hero.slug}`}
                >
                  <HeroPortrait
                    name={hero.name}
                    url={hero.portraitUrl}
                    size={32}
                  />
                  {hero.name}
                </Link>
              ))}
            </span>
          </>
        }
      >
        {({ describedBy, open }) => (
          <button
            type="button"
            className={clsx("category-chip", {
              "category-chip--open": open,
            })}
            aria-describedby={describedBy}
          >
            {category.name}
            <span className="category-chip__count">
              {category.heroes.length}
            </span>
          </button>
        )}
      </Tooltip>
    </li>
  );
}
