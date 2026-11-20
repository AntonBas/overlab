import { Tooltip } from "../../../components/ui/Tooltip";
import type { HeroCategory } from "../../../types/hero";
import { categoryStyleOf } from "../utils/categoryStyle";
import { CategoryTip } from "./CategoryTip";

interface HeroCategoryChipsProps {
  heroSlug: string;
  categories: HeroCategory[] | undefined;
}

export function HeroCategoryChips({
  heroSlug,
  categories,
}: HeroCategoryChipsProps) {
  const own = (categories ?? []).filter((category) =>
    category.heroes.some((hero) => hero.slug === heroSlug),
  );
  if (own.length === 0) {
    return null;
  }
  return (
    <ul className="hero-categories" aria-label="Hero categories">
      {own.map((category) => {
        const { icon: Icon, group } = categoryStyleOf(category.slug);
        return (
          <li key={category.slug}>
            <Tooltip
              interactive
              mount="open"
              role="dialog"
              label={`${category.name}: heroes`}
              tipClassName={`perk-tip perk-tip--interactive category-tip category-tip--${group}`}
              content={<CategoryTip category={category} />}
            >
              {({ describedBy }) => (
                <button
                  type="button"
                  className="hero-category-chip"
                  data-group={group}
                  aria-describedby={describedBy}
                >
                  <Icon
                    className="hero-category-chip__glyph"
                    aria-hidden="true"
                  />
                  {category.name}
                </button>
              )}
            </Tooltip>
          </li>
        );
      })}
    </ul>
  );
}
