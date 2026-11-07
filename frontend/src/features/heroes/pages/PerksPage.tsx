import clsx from "clsx";
import { useState } from "react";
import { Link } from "react-router-dom";
import { AllRolesBadge } from "../../../components/ui/AllRolesBadge";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { HeroPortrait } from "../../../components/ui/HeroPortrait";
import { PageHeader } from "../../../components/ui/PageHeader";
import { SubroleBadge } from "../../../components/ui/SubroleBadge";
import { RoleBadge } from "../../../components/ui/RoleBadge";
import { Spinner } from "../../../components/ui/Spinner";
import { useFetch } from "../../../hooks/useFetch";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { FavoritesFilterButton } from "../../personal/components/FavoritesFilterButton";
import { FavoriteButton } from "../../personal/components/FavoriteButton";
import { usePersonalData } from "../../personal/context/usePersonalData";
import { ROLE_LABELS } from "../../../utils/format";
import { matchesName } from "../../../utils/search";
import type { HeroRole } from "../../../types/api";
import { ROLES } from "../../stats/filters";
import { fetchAllPerks, fetchHeroes } from "../api/heroesApi";
import { heroBackdropStyle } from "../utils/heroBackdrop";
import { PerkList } from "../components/PerkList";

export function PerksPage() {
  usePageTitle("Perks");
  const heroes = useFetch(fetchHeroes, []);
  const perks = useFetch(fetchAllPerks, []);
  const [role, setRole] = useState<HeroRole | null>(null);
  const [query, setQuery] = useState("");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const { favoriteHeroes } = usePersonalData();

  if (heroes.loading || perks.loading) {
    return <Spinner />;
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
      {visibleHeroes.length === 0 ? (
        <EmptyState>
          {onlyFavorites && favoriteHeroes.size === 0
            ? "You have no favorite heroes yet. Use the star on a hero card to add one."
            : "No heroes match the filters."}
        </EmptyState>
      ) : (
        <ul className="hero-perks-grid">
          {visibleHeroes.map((hero) => (
            <li key={hero.slug} className="hero-perks-item">
              <article
                className={clsx(
                  "hero-perks",
                  `hero-perks--${hero.role.toLowerCase()}`,
                  {
                    "hero-perks--backdrop":
                      heroBackdropStyle(hero.slug) !== undefined,
                  },
                )}
                style={heroBackdropStyle(hero.slug)}
              >
                <div className="hero-perks__top">
                  <Link
                    className="hero-perks__header"
                    to={`/heroes/${hero.slug}`}
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
                  perks={allPerks.filter((perk) => perk.heroSlug === hero.slug)}
                />
              </article>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
