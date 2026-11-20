import { SectionLink } from "../../../components/ui/SectionLink";
import clsx from "clsx";
import {
  Handshake,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { CategoryAvatar } from "./CategoryAvatar";
import { HeroPortrait } from "../../../components/ui/HeroPortrait";
import type {
  CategoryMatchup,
  CategoryMatchupType,
  HeroCategory,
  RelatedHero,
} from "../../../types/hero";
import { withoutCoveredHeroes } from "../utils/categoryCoverage";

interface RelationsOverviewProps {
  heroName: string;
  strongAgainst: RelatedHero[];
  counteredBy: RelatedHero[];
  synergies: RelatedHero[];
  categories?: HeroCategory[];
  categoryMatchups?: CategoryMatchup[];
  moreHref: string;
}

interface OverviewRow {
  key: string;
  label: string;
  groups: { category: HeroCategory; matchup: CategoryMatchup }[];
  heroes: RelatedHero[];
}

const HEROES_PER_ROW = 6;

const ROW_ICONS: Record<string, LucideIcon> = {
  strong: TrendingUp,
  struggles: TrendingDown,
  synergies: Handshake,
};
const NO_CATEGORIES: HeroCategory[] = [];
const NO_MATCHUPS: CategoryMatchup[] = [];

export function RelationsOverview({
  heroName,
  strongAgainst,
  counteredBy,
  synergies,
  categories = NO_CATEGORIES,
  categoryMatchups = NO_MATCHUPS,
  moreHref,
}: RelationsOverviewProps) {
  const categoriesBySlug = new Map(
    categories.map((category) => [category.slug, category]),
  );

  function buildRow(
    key: string,
    label: string,
    type: CategoryMatchupType,
    heroes: RelatedHero[],
  ): OverviewRow {
    const matchups = categoryMatchups.filter(
      (matchup) =>
        matchup.type === type && categoriesBySlug.has(matchup.categorySlug),
    );
    return {
      key,
      label,
      groups: matchups.flatMap((matchup) => {
        const category = categoriesBySlug.get(matchup.categorySlug);
        return category ? [{ category, matchup }] : [];
      }),
      heroes: withoutCoveredHeroes(heroes, matchups, categoriesBySlug),
    };
  }

  const rows = [
    buildRow("strong", "Strong against", "STRONG_AGAINST", strongAgainst),
    buildRow("struggles", "Struggles against", "WEAK_AGAINST", counteredBy),
    buildRow("synergies", "Works well with", "WORKS_WITH", synergies),
  ].filter((row) => row.groups.length + row.heroes.length > 0);

  if (rows.length === 0) {
    return null;
  }

  return (
    <section className="section">
      <div className="section__heading">
        <div className="section__title">
          <h2>{heroName} counters and synergies</h2>
          <p className="muted section__description">
            Curated recommendations, not statistics.
          </p>
        </div>
        <SectionLink to={moreHref}>All counters</SectionLink>
      </div>
      <ul className="relations-overview">
        {rows.map((row) => {
          const hidden = Math.max(0, row.heroes.length - HEROES_PER_ROW);
          const RowIcon = ROW_ICONS[row.key];
          return (
            <li
              key={row.key}
              className={clsx(
                "relations-overview__row",
                `relations-overview__row--${row.key}`,
              )}
            >
              <span className="relations-overview__label">
                <RowIcon
                  className="relations-overview__label-icon"
                  aria-hidden="true"
                />
                {row.label}
              </span>
              <span className="relations-overview__heroes">
                {row.groups.map((group) => (
                  <CategoryAvatar
                    key={group.category.slug}
                    category={group.category}
                    matchup={group.matchup}
                    to={moreHref}
                  />
                ))}
                {row.groups.length > 0 && row.heroes.length > 0 && (
                  <span
                    className="relations-overview__divider"
                    aria-hidden="true"
                  />
                )}
                {row.heroes.slice(0, HEROES_PER_ROW).map((hero) => (
                  <Link
                    key={hero.slug}
                    className={clsx(
                      "relation-avatar",
                      `relation-avatar--${hero.role.toLowerCase()}`,
                    )}
                    to={`/heroes/${hero.slug}`}
                    title={hero.name}
                  >
                    <span className="relation-avatar__image">
                      <HeroPortrait
                        name={hero.name}
                        url={hero.portraitUrl}
                        size={32}
                      />
                    </span>
                    <span className="relation-avatar__name">{hero.name}</span>
                  </Link>
                ))}
                {hidden > 0 && (
                  <Link className="relations-overview__more" to={moreHref}>
                    +{hidden}
                  </Link>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
