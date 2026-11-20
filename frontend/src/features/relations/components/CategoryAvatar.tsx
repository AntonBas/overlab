import { Link } from "react-router-dom";
import { Tooltip } from "../../../components/ui/Tooltip";
import type { CategoryMatchup, HeroCategory } from "../../../types/hero";
import { categoryStyleOf } from "../utils/categoryStyle";
import { CategoryTip } from "./CategoryTip";

interface CategoryAvatarProps {
  category: HeroCategory;
  matchup: CategoryMatchup;
  to?: string;
}

export function CategoryAvatar({ category, matchup, to }: CategoryAvatarProps) {
  const { icon: Icon, group } = categoryStyleOf(category.slug);
  return (
    <Tooltip
      interactive
      mount="open"
      role="dialog"
      label={`${category.name}: heroes`}
      tipClassName={`perk-tip perk-tip--interactive category-tip category-tip--${group}`}
      content={<CategoryTip category={category} matchup={matchup} />}
    >
      {({ describedBy }) => {
        const content = (
          <>
            <span className="category-icon">
              <Icon className="category-icon__glyph" aria-hidden="true" />
              <span className="category-icon__count">
                {category.heroes.length}
              </span>
            </span>
            <span className="relation-avatar__name">{category.name}</span>
          </>
        );
        const className = "relation-avatar relation-avatar--category";
        return to ? (
          <Link
            className={className}
            data-group={group}
            to={to}
            title={category.name}
            aria-describedby={describedBy}
          >
            {content}
          </Link>
        ) : (
          <button
            type="button"
            className={className}
            data-group={group}
            title={category.name}
            aria-describedby={describedBy}
          >
            {content}
          </button>
        );
      }}
    </Tooltip>
  );
}
