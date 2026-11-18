import clsx from "clsx";
import { Tooltip } from "../../../components/ui/Tooltip";
import type { CategoryMatchup, HeroCategory } from "../../../types/hero";
import { CategoryTip } from "./CategoryTip";

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
        content={<CategoryTip category={category} matchup={matchup} />}
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
