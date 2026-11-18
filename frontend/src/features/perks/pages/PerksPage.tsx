import { Link } from "react-router-dom";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { HeroPortrait } from "../../../components/ui/HeroPortrait";
import { PageHeader } from "../../../components/ui/PageHeader";
import { SubroleBadge } from "../../../components/ui/SubroleBadge";
import { RoleBadge } from "../../../components/ui/RoleBadge";
import { RevealMore } from "../../../components/ui/RevealMore";
import { Spinner } from "../../../components/ui/Spinner";
import { useFetch } from "../../../hooks/useFetch";
import { usePageTitle } from "../../../hooks/usePageTitle";
import {
  breadcrumbList,
  useStructuredData,
} from "../../../hooks/useStructuredData";
import { usePageDescription } from "../../../hooks/usePageDescription";
import { FavoriteButton } from "../../personal";
import { usePersonalData } from "../../personal";
import { ROLE_LABELS } from "../../../utils/format";
import { matchesName } from "../../../utils/search";
import { ROLES } from "../../stats";
import { fetchHeroes } from "../../heroes";
import { HeroFilterBar } from "../../heroes/components/HeroFilterBar";
import { useHeroListView } from "../../heroes/hooks/useHeroListView";
import { fetchAllPerks } from "../api/perksApi";
import { BackdropCard } from "../components/BackdropCard";
import { PerkList } from "../components/PerkList";
import { staticSeoPage } from "../../../utils/staticSeoPages";

const HEROES_PER_STEP = 12;

export function PerksPage() {
  const page = staticSeoPage("/perks");
  usePageTitle(page.title);
  usePageDescription(page.description);
  useStructuredData(
    breadcrumbList(
      [
        { name: "Overlab", path: "/" },
        { name: "Perks", path: "/perks" },
      ],
      window.location.origin,
    ),
  );
  const heroes = useFetch(fetchHeroes, []);
  const perks = useFetch(fetchAllPerks, []);
  const {
    role,
    query,
    onlyFavorites,
    shownRows,
    setRole,
    setQuery,
    setOnlyFavorites,
    showMore,
  } = useHeroListView(HEROES_PER_STEP);
  const { favoriteHeroes } = usePersonalData();

  if (heroes.loading || perks.loading) {
    return <Spinner page label="Loading perks" />;
  }
  const failure = heroes.error ?? perks.error;
  if (failure || !heroes.data || !perks.data) {
    return failure ? (
      <ErrorMessage
        failure={failure}
        onRetry={() => {
          heroes.reload();
          perks.reload();
        }}
      />
    ) : null;
  }
  const allPerks = perks.data;
  const allHeroes = heroes.data;

  const visibleHeroes = allHeroes
    .filter(
      (hero) =>
        (role === null || hero.role === role) &&
        (!onlyFavorites || favoriteHeroes.has(hero.slug)) &&
        matchesName(hero.name, query) &&
        allPerks.some((perk) => perk.heroSlug === hero.slug),
    )
    .sort(
      (first, second) =>
        ROLES.indexOf(first.role) - ROLES.indexOf(second.role) ||
        first.name.localeCompare(second.name),
    );

  return (
    <>
      <PageHeader
        title="Perks"
        subtitle="Minor and major perks of every hero, left and right as in the game"
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
        <>
          <ul className="hero-perks-grid">
            {visibleHeroes.slice(0, shownRows).map((hero) => (
              <li key={hero.slug} className="hero-perks-item">
                <BackdropCard slug={hero.slug} role={hero.role}>
                  <div className="hero-perks__top">
                    <Link
                      className="hero-perks__header"
                      to={`/heroes/${hero.slug}/perks`}
                    >
                      <HeroPortrait
                        name={hero.name}
                        url={hero.portraitUrl}
                        size={48}
                      />
                      <span className="hero-perks__title">
                        <strong>{hero.name}</strong>
                        <span className="muted">
                          {hero.subrole ? (
                            <SubroleBadge subrole={hero.subrole} />
                          ) : (
                            ROLE_LABELS[hero.role]
                          )}
                        </span>
                      </span>
                      <RoleBadge role={hero.role} compact />
                    </Link>
                    <FavoriteButton
                      compact
                      kind="hero"
                      slug={hero.slug}
                      name={hero.name}
                    />
                  </div>
                  <PerkList
                    compact
                    perks={allPerks.filter(
                      (perk) => perk.heroSlug === hero.slug,
                    )}
                  />
                </BackdropCard>
              </li>
            ))}
          </ul>
          <RevealMore
            remaining={visibleHeroes.length - shownRows}
            shown={shownRows}
            noun="heroes"
            onMore={showMore}
          />
        </>
      )}
    </>
  );
}
