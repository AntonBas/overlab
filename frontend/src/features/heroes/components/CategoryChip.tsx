import clsx from "clsx";
import { useId } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { HeroPortrait } from "../../../components/ui/HeroPortrait";
import { useFloatingTip } from "../../../hooks/useFloatingTip";
import type { CategoryMatchup, HeroCategory } from "../../../types/api";
import { AbilityText } from "./AbilityText";
import { Strength } from "./RelatedHeroes";

interface CategoryChipProps {
  category: HeroCategory;
  matchup: CategoryMatchup;
}

export function CategoryChip({ category, matchup }: CategoryChipProps) {
  const tipId = useId();
  const { open, style, triggerRef, tipRef, triggerProps, tipProps } =
    useFloatingTip();
  return (
    <li>
      <span ref={triggerRef} {...triggerProps}>
        <button
          type="button"
          className={clsx("category-chip", {
            "category-chip--open": open,
          })}
          aria-describedby={open ? tipId : undefined}
        >
          {category.name}
          <span className="category-chip__count">{category.heroes.length}</span>
        </button>
      </span>
      {open &&
        createPortal(
          <span
            id={tipId}
            role="tooltip"
            ref={tipRef}
            className="perk-tip perk-tip--interactive category-tip"
            style={style}
            {...tipProps}
          >
            <span className="perk-tip__header">
              <span className="perk-tip__title">
                <strong>{category.name}</strong>
              </span>
              <Strength value={matchup.strength} />
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
          </span>,
          document.body,
        )}
    </li>
  );
}
