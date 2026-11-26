import clsx from "clsx";
import { Link } from "react-router-dom";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { HeroPortrait } from "../../../components/ui/HeroPortrait";
import { PageHeader } from "../../../components/ui/PageHeader";
import { RevealMore } from "../../../components/ui/RevealMore";
import { ListSkeleton } from "../../../components/ui/ListSkeleton";
import { SubroleBadge } from "../../../components/ui/SubroleBadge";
import { useFetch } from "../../../hooks/useFetch";
import { usePageTitle } from "../../../hooks/usePageTitle";
import {
  breadcrumbList,
  useStructuredData,
} from "../../../hooks/useStructuredData";
import { usePageDescription } from "../../../hooks/usePageDescription";
import type { CategoryMatchup } from "../../../types/hero";
import { ROLE_LABELS } from "../../../utils/format";
import { matchesName } from "../../../utils/search";
import { FavoriteButton } from "../../personal";
import { usePersonalData } from "../../personal";
import { ROLES } from "../../stats";
import { fetchHeroes } from "../../heroes";
import { HeroFilterBar } from "../../heroes/components/HeroFilterBar";
import { useHeroListView } from "../../heroes/hooks/useHeroListView";
import { fetchAllRelations, fetchHeroCategories } from "../api/relationsApi";
import { CategoryAvatar } from "../components/CategoryAvatar";
import { RelationAvatar } from "../components/RelationAvatar";
import {
  bindRelationFeedback,
  useRelationVotes,
} from "../hooks/useRelationFeedback";
import { relationPath } from "../utils/relationPaths";
import { staticSeoPage } from "../../../utils/staticSeoPages";

const COLUMNS = [
  {
    key: "counters",
    tab: "strong",
    label: "Strong against",
    matchupType: "STRONG_AGAINST",
    relationKind: "COUNTER",
  },
  {
    key: "counteredBy",
    tab: "struggles",
    label: "Struggles against",
    matchupType: "WEAK_AGAINST",
    relationKind: "COUNTER",
  },
  {
    key: "synergies",
    tab: "synergies",
    label: "Works well with",
    matchupType: "WORKS_WITH",
    relationKind: "SYNERGY",
  },
] as const;

const ROWS_PER_STEP = 12;

export function CountersPage() {
  const page = staticSeoPage("/counters");
  usePageTitle(page.title);
  usePageDescription(page.description);
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
  const {
    role,
    query,
    onlyFavorites,
    shownRows,
    setRole,
    setQuery,
    setOnlyFavorites,
    showMore,
  } = useHeroListView(ROWS_PER_STEP);
  const { favoriteHeroes } = usePersonalData();
  const relationVotes = useRelationVotes();

  if (heroes.loading || relations.loading || categories.loading) {
    return <ListSkeleton kind="hero-tiles" label="Loading counters" />;
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
        subtitle="Curated recommendations, not statistics: who every hero is strong against, who counters them and who they work well with"
      />
      <HeroFilterBar
        query={query}
        onQueryChange={setQuery}
        role={role}
        onRoleChange={setRole}
        onlyFavorites={onlyFavorites}
        onOnlyFavoritesChange={setOnlyFavorites}
      />
      {visibleHeroes.length === 0 ? (
        <EmptyState
          kind={
            onlyFavorites && favoriteHeroes.size === 0 ? "empty" : "no-match"
          }
        >
          {onlyFavorites && favoriteHeroes.size === 0
            ? "You have no favorite heroes yet. Use the star on a hero card to add one."
            : "No heroes match the filters."}
        </EmptyState>
      ) : (
        <div className="matchups">
          <ul className="matchups__rows">
            {visibleHeroes.slice(0, shownRows).map((hero) => {
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
                      to={`/heroes/${hero.slug}/counters`}
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
                    const related = entry?.[column.key] ?? [];
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
                                <li key={matchup.categorySlug}>
                                  <CategoryAvatar
                                    category={category}
                                    matchup={matchup}
                                    to={relationPath(
                                      hero.slug,
                                      column.tab,
                                      category.slug,
                                    )}
                                  />
                                </li>
                              ) : null;
                            })}
                            {related.map((relatedHero) => (
                              <RelationAvatar
                                key={relatedHero.slug}
                                hero={relatedHero}
                                to={relationPath(
                                  hero.slug,
                                  column.tab,
                                  relatedHero.slug,
                                )}
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
          <RevealMore
            remaining={visibleHeroes.length - shownRows}
            shown={shownRows}
            noun="heroes"
            onMore={showMore}
          />
        </div>
      )}
    </>
  );
}
