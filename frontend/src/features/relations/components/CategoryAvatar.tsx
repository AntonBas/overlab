import { Link } from "react-router-dom";
import { HeroPortrait } from "../../../components/ui/HeroPortrait";
import { Tooltip } from "../../../components/ui/Tooltip";
import type { CategoryMatchup, HeroCategory } from "../../../types/hero";
import { CategoryTip } from "./CategoryTip";

const MOSAIC_HEROES = 4;

interface CategoryAvatarProps {
  category: HeroCategory;
  matchup: CategoryMatchup;
  to: string;
}

export function CategoryAvatar({ category, matchup, to }: CategoryAvatarProps) {
  return (
    <Tooltip
      interactive
      mount="open"
      role="dialog"
      label={`${category.name}: heroes`}
      tipClassName="perk-tip perk-tip--interactive category-tip"
      content={<CategoryTip category={category} matchup={matchup} />}
    >
      {({ describedBy }) => (
        <Link
          className="relation-avatar relation-avatar--category"
          to={to}
          aria-describedby={describedBy}
        >
          <span className="relation-avatar__image category-mosaic">
            {category.heroes.slice(0, MOSAIC_HEROES).map((hero) => (
              <HeroPortrait
                key={hero.slug}
                name={hero.name}
                url={hero.portraitUrl}
                size={16}
              />
            ))}
            <span className="category-mosaic__count">
              {category.heroes.length}
            </span>
          </span>
          <span className="relation-avatar__name">{category.name}</span>
        </Link>
      )}
    </Tooltip>
  );
}
