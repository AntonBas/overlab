import clsx from "clsx";
import { useId, type KeyboardEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type {
  CategoryMatchup,
  CategoryMatchupType,
  HeroCategory,
  RelatedHero,
} from "../../../types/hero";
import type { RelationFeedback } from "../hooks/useRelationFeedback";
import { RelatedHeroes } from "./RelatedHeroes";

type RelationTabId = "strong" | "struggles" | "synergies";

interface RelationTab {
  id: RelationTabId;
  label: string;
  heroes: RelatedHero[];
  matchups: CategoryMatchup[];
}

interface RelationTabsProps {
  strongAgainst: RelatedHero[];
  counteredBy: RelatedHero[];
  synergies: RelatedHero[];
  categoryMatchups?: CategoryMatchup[];
  categories?: HeroCategory[];
  feedback?: RelationFeedback;
  heroName?: string;
  description?: string;
  showHeading?: boolean;
  moreHref?: string;
}

const MATCHUP_TYPES: Record<RelationTabId, CategoryMatchupType> = {
  strong: "STRONG_AGAINST",
  struggles: "WEAK_AGAINST",
  synergies: "WORKS_WITH",
};

const NO_MATCHUPS: CategoryMatchup[] = [];
const NO_CATEGORIES: HeroCategory[] = [];

export function RelationTabs({
  strongAgainst,
  counteredBy,
  synergies,
  categoryMatchups = NO_MATCHUPS,
  categories = NO_CATEGORIES,
  feedback,
  heroName,
  description,
  showHeading = true,
  moreHref,
}: RelationTabsProps) {
  const baseId = useId();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoriesBySlug = new Map(
    categories.map((category) => [category.slug, category]),
  );
  const matchupsOf = (id: RelationTabId) =>
    categoryMatchups.filter(
      (matchup) =>
        matchup.type === MATCHUP_TYPES[id] &&
        categoriesBySlug.has(matchup.categorySlug),
    );
  const allTabs: RelationTab[] = [
    {
      id: "strong",
      label: "Strong against",
      heroes: strongAgainst,
      matchups: matchupsOf("strong"),
    },
    {
      id: "struggles",
      label: "Struggles against",
      heroes: counteredBy,
      matchups: matchupsOf("struggles"),
    },
    {
      id: "synergies",
      label: "Works well with",
      heroes: synergies,
      matchups: matchupsOf("synergies"),
    },
  ];
  const tabs = allTabs.filter(
    (tab) => tab.heroes.length + tab.matchups.length > 0,
  );

  if (tabs.length === 0) {
    return null;
  }

  const requested = searchParams.get("tab");
  const active = tabs.find((tab) => tab.id === requested) ?? tabs[0];

  function select(id: RelationTabId) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set("tab", id);
        return next;
      },
      { replace: true },
    );
  }

  function move(event: KeyboardEvent, offset: number) {
    event.preventDefault();
    const index = tabs.findIndex((tab) => tab.id === active.id);
    const target = tabs[(index + offset + tabs.length) % tabs.length];
    select(target.id);
    document.getElementById(`${baseId}-tab-${target.id}`)?.focus();
  }

  const groups = active.matchups.flatMap((matchup) => {
    const category = categoriesBySlug.get(matchup.categorySlug);
    return category ? [{ category, note: matchup.note }] : [];
  });

  return (
    <section className="section">
      {showHeading && (
        <div className="section__heading">
          <h2>
            {heroName
              ? `${heroName} counters and synergies`
              : "Counters and synergies"}
          </h2>
          {moreHref && <Link to={moreHref}>Counters page</Link>}
        </div>
      )}
      {description && (
        <p className="muted section__description">{description}</p>
      )}
      <div
        className="segmented"
        role="tablist"
        aria-label="Counters and synergies"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`${baseId}-tab-${tab.id}`}
            type="button"
            role="tab"
            className={clsx("segmented__item", {
              "segmented__item--active": tab.id === active.id,
            })}
            aria-selected={tab.id === active.id}
            aria-controls={`${baseId}-panel`}
            tabIndex={tab.id === active.id ? 0 : -1}
            onClick={() => select(tab.id)}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight") {
                move(event, 1);
              } else if (event.key === "ArrowLeft") {
                move(event, -1);
              }
            }}
          >
            {tab.label}{" "}
            <span className="segmented__count">
              {tab.heroes.length + tab.matchups.length}
            </span>
          </button>
        ))}
      </div>
      <div
        id={`${baseId}-panel`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${active.id}`}
        className="relation-tabs__panel"
      >
        {active.heroes.length + groups.length > 0 && (
          <RelatedHeroes
            key={active.id}
            heroes={active.heroes}
            groups={groups}
            type={active.id === "synergies" ? "SYNERGY" : "COUNTER"}
            feedback={feedback}
          />
        )}
      </div>
    </section>
  );
}
