import { Link } from "react-router-dom";
import { HeroPortrait } from "../../../components/ui/HeroPortrait";
import type {
  CategoryMatchup,
  CategoryMatchupType,
  HeroCategory,
} from "../../../types/hero";
import { AbilityText } from "../../abilities";
import { CATEGORY_GROUP_LABELS, categoryStyleOf } from "../utils/categoryStyle";
import { countersPath } from "../utils/relationPaths";

const MATCHUP_LABELS: Record<CategoryMatchupType, string> = {
  STRONG_AGAINST: "Strong against",
  WEAK_AGAINST: "Struggles against",
  WORKS_WITH: "Works well with",
};

const LIMITS_MARKER = /\s*Limits:\s*/;
const REASON_MARKER = /^Why it works:\s*/;

interface CategoryTipProps {
  category: HeroCategory;
  matchup?: CategoryMatchup;
}

function splitNote(note: string) {
  const [reason, limits] = note.split(LIMITS_MARKER);
  return { reason: reason.replace(REASON_MARKER, ""), limits };
}

export function CategoryTip({ category, matchup }: CategoryTipProps) {
  const { icon: Icon, group } = categoryStyleOf(category.slug);
  const note = matchup?.note ? splitNote(matchup.note) : null;
  const heroCount = category.heroes.length;
  return (
    <>
      <span className="category-tip__header">
        <span className="category-tip__icon">
          <Icon className="category-tip__glyph" aria-hidden="true" />
        </span>
        <span className="category-tip__title">
          <strong>{category.name}</strong>
          <span className="category-tip__meta">
            {CATEGORY_GROUP_LABELS[group]} · {heroCount}{" "}
            {heroCount === 1 ? "hero" : "heroes"}
          </span>
        </span>
        {matchup && (
          <span
            className={`category-tip__badge category-tip__badge--${matchup.type.toLowerCase()}`}
          >
            {MATCHUP_LABELS[matchup.type]}
          </span>
        )}
      </span>
      {category.description && (
        <span className="category-tip__description">
          {category.description}
        </span>
      )}
      {note && (
        <span className="category-tip__note">
          <span className="category-tip__section">
            <span className="category-tip__label">Why it works</span>
            <span>
              <AbilityText text={note.reason} />
            </span>
          </span>
          {note.limits && (
            <span className="category-tip__section">
              <span className="category-tip__label">Limits</span>
              <span>
                <AbilityText text={note.limits} />
              </span>
            </span>
          )}
        </span>
      )}
      <span className="category-tip__heroes-label">
        Heroes in this category
      </span>
      <span className="category-tip__heroes">
        {category.heroes.map((hero) => (
          <Link
            key={hero.slug}
            className={`category-tip__hero category-tip__hero--${hero.role.toLowerCase()}`}
            to={countersPath(hero.slug)}
          >
            <HeroPortrait name={hero.name} url={hero.portraitUrl} size={24} />
            {hero.name}
          </Link>
        ))}
      </span>
    </>
  );
}
