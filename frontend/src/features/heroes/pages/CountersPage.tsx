import clsx from "clsx";
import { useState } from "react";
import { Link } from "react-router-dom";
import { AllRolesBadge } from "../../../components/ui/AllRolesBadge";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { HeroPortrait } from "../../../components/ui/HeroPortrait";
import { PageHeader } from "../../../components/ui/PageHeader";
import { RoleBadge } from "../../../components/ui/RoleBadge";
import { Spinner } from "../../../components/ui/Spinner";
import { SubroleBadge } from "../../../components/ui/SubroleBadge";
import { useFetch } from "../../../hooks/useFetch";
import { usePageTitle } from "../../../hooks/usePageTitle";
import {
  breadcrumbList,
  useStructuredData,
} from "../../../hooks/useStructuredData";
import { usePageDescription } from "../../../hooks/usePageDescription";
import type { CategoryMatchup, HeroRole } from "../../../types/api";
import { ROLE_LABELS } from "../../../utils/format";
import { matchesName } from "../../../utils/search";
import { FavoriteButton } from "../../personal/components/FavoriteButton";
import { FavoritesFilterButton } from "../../personal/components/FavoritesFilterButton";
import { usePersonalData } from "../../personal/context/usePersonalData";
import { ROLES } from "../../stats/filters";
import {
  fetchAllRelations,
  fetchHeroCategories,
  fetchHeroes,
} from "../api/heroesApi";
import { CategoryChip } from "../components/profile/CategoryChip";
import { RelationAvatar } from "../components/relations/RelationAvatar";
import {
  bindRelationFeedback,
  useRelationVotes,
} from "../hooks/useRelationFeedback";
import { withoutCoveredHeroes } from "../utils/categoryCoverage";
import { FiltersPanel } from "../../../components/ui/FiltersPanel";

const COLUMNS = [
  {
    key: "counters",
    label: "Strong against",
    matchupType: "STRONG_AGAINST",
    relationKind: "COUNTER",
  },
  {
    key: "counteredBy",
    label: "Struggles against",
    matchupType: "WEAK_AGAINST",
    relationKind: "COUNTER",
  },
  {
    key: "synergies",
    label: "Works well with",
    matchupType: "WORKS_WITH",
    relationKind: "SYNERGY",
  },
] as const;

export function CountersPage() {
  usePageTitle("Overwatch 2 counters and synergies for every hero");
  usePageDescription(
    "Curated Overwatch 2 counter picks and synergies for every hero, with short explanations.",
  );
  useStructuredData(
    breadcrumbList(
      [
        { name: "Overlab", path: "/" },
        { name: "Counters", path: "/counters" },
      ],
      window.location.origin,
    ),
  );
  const heroes = useFetch(fetchHeroes, []);
  const relations = useFetch(fetchAllRelations, []);
  const categories = useFetch(fetchHeroCategories, []);
  const [role, setRole] = useState<HeroRole | null>(null);
  const [query, setQuery] = useState("");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const { favoriteHeroes } = usePersonalData();
  const relationVotes = useRelationVotes();

  if (heroes.loading || relations.loading || categories.loading) {
    return <Spinner page />;
  }
  const failure = heroes.error ?? relations.error ?? categories.error;
  if (failure || !heroes.data || !relations.data || !categories.data) {
    return failure ? (
      <ErrorMessage
        failure={failure}
        onRetry={() => {
          heroes.reload();
          relations.reload();
          categories.reload();
        }}
      />
    ) : null;
  }
  const categoriesBySlug = new Map(
    categories.data.categories.map((category) => [category.slug, category]),
  );
  const matchupsByHero = new Map<string, CategoryMatchup[]>();
  for (const matchup of categories.data.matchups) {
    matchupsByHero.set(matchup.heroSlug, [
      ...(matchupsByHero.get(matchup.heroSlug) ?? []),
      matchup,
    ]);
  }
  const relationsByHero = new Map(
    relations.data.map((entry) => [entry.heroSlug, entry]),
  );

  const visibleHeroes = heroes.data
    .filter((hero) => {
      const entry = relationsByHero.get(hero.slug);
      return (
        (role === null || hero.role === role) &&
        (!onlyFavorites || favoriteHeroes.has(hero.slug)) &&
        matchesName(hero.name, query) &&
        (matchupsByHero.has(hero.slug) ||
          (entry !== undefined &&
            entry.counters.length +
              entry.counteredBy.length +
              entry.synergies.length >
              0))
      );
    })
    .sort(
      (first, second) =>
        ROLES.indexOf(first.role) - ROLES.indexOf(second.role) ||
        first.name.localeCompare(second.name),
    );

  return (
    <>
      <PageHeader
        title="Counters and synergies"
        subtitle="Who every hero is strong against, who counters them and who they work well with"
      />
      <FiltersPanel>
        <div className="filters">
          <label className="field">
            <span className="field__label">Hero</span>
            <input
              type="search"
              value={query}
              placeholder="Search by name"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <div className="field">
            <span className="field__label">Role</span>
            <div className="segmented" role="group" aria-label="Role">
              {[null, ...ROLES].map((value) => (
                <button
                  key={value ?? "all"}
                  type="button"
                  className={clsx("segmented__item", {
                    "segmented__item--active": role === value,
                  })}
                  aria-pressed={role === value}
                  onClick={() => setRole(value)}
                >
                  {value ? (
                    <RoleBadge role={value} />
                  ) : (
                    <AllRolesBadge label="All" />
                  )}
                </button>
              ))}
            </div>
          </div>
          <FavoritesFilterButton
            active={onlyFavorites}
            onToggle={() => setOnlyFavorites(!onlyFavorites)}
          />
        </div>
      </FiltersPanel>
      {visibleHeroes.length === 0 ? (
        <EmptyState>
          {onlyFavorites && favoriteHeroes.size === 0
            ? "You have no favorite heroes yet. Use the star on a hero card to add one."
            : "No heroes match the filters."}
        </EmptyState>
      ) : (
        <div className="matchups">
          <ul className="matchups__rows">
            {visibleHeroes.map((hero) => {
              const entry = relationsByHero.get(hero.slug);
              return (
                <li
                  key={hero.slug}
                  className={clsx(
                    "matchup",
                    `matchup--${hero.role.toLowerCase()}`,
                  )}
                >
                  <div className="matchup__hero">
                    <Link
                      className="matchup__identity"
                      to={`/heroes/${hero.slug}#counters`}
                    >
                      <HeroPortrait
                        name={hero.name}
                        url={hero.portraitUrl}
                        size={48}
                      />
                      <span className="matchup__title">
                        <strong>{hero.name}</strong>
                        <span className="muted">
                          {hero.subrole ? (
                            <SubroleBadge subrole={hero.subrole} />
                          ) : (
                            ROLE_LABELS[hero.role]
                          )}
                        </span>
                      </span>
                    </Link>
                    <FavoriteButton
                      compact
                      kind="hero"
                      slug={hero.slug}
                      name={hero.name}
                    />
                  </div>
                  {COLUMNS.map((column) => {
                    const categoryMatchups = (
                      matchupsByHero.get(hero.slug) ?? []
                    ).filter((matchup) => matchup.type === column.matchupType);
                    const related = withoutCoveredHeroes(
                      entry?.[column.key] ?? [],
                      categoryMatchups,
                      categoriesBySlug,
                    );
                    return (
                      <div
                        key={column.key}
                        className={`matchup__cell matchup__cell--${column.key}`}
                      >
                        <span className="matchup__label">{column.label}</span>
                        {related.length + categoryMatchups.length === 0 ? (
                          <span className="matchup__empty">
                            No recommendations yet
                          </span>
                        ) : (
                          <ul className="matchup__list">
                            {categoryMatchups.map((matchup) => {
                              const category = categoriesBySlug.get(
                                matchup.categorySlug,
                              );
                              return category ? (
                                <CategoryChip
                                  key={matchup.categorySlug}
                                  category={category}
                                  matchup={matchup}
                                />
                              ) : null;
                            })}
                            {related.map((relatedHero) => (
                              <RelationAvatar
                                key={relatedHero.slug}
                                hero={relatedHero}
                                type={column.relationKind}
                                feedback={bindRelationFeedback(
                                  relationVotes,
                                  hero.slug,
                                )}
                              />
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <p className="muted footnote">
        Counters and synergies are curated recommendations, not statistics.
      </p>
    </>
  );
}
