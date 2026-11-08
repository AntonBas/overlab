import clsx from "clsx";
import { useState } from "react";
import { Link } from "react-router-dom";
import { DeltaValue } from "../../../components/ui/DeltaValue";
import { HeroPortrait } from "../../../components/ui/HeroPortrait";
import { RoleBadge } from "../../../components/ui/RoleBadge";
import type { HeroStat } from "../../../types/api";
import { formatPercent } from "../../../utils/format";
import { picksByRole } from "../utils/bestPicks";

interface MapBestPicksProps {
  heroes: HeroStat[];
  mapName: string;
  linkSuffix: string;
}

function PickList({
  title,
  heroes,
  linkSuffix,
}: {
  title: string;
  heroes: HeroStat[];
  linkSuffix: string;
}) {
  if (heroes.length === 0) {
    return null;
  }
  return (
    <>
      <p className="highlight__label muted">{title}</p>
      <ol className="highlight__list">
        {heroes.map((hero) => (
          <li key={hero.heroSlug}>
            <Link
              className="highlight__hero"
              to={`/heroes/${hero.heroSlug}${linkSuffix}`}
            >
              <span className="highlight__portrait">
                <HeroPortrait
                  name={hero.heroName}
                  url={hero.portraitUrl}
                  size={36}
                />
              </span>
              <span className="highlight__name">{hero.heroName}</span>
              <span className="highlight__delta">
                <DeltaValue value={hero.winRateDelta} />
              </span>
              <span className="highlight__stats muted">
                {formatPercent(hero.winRate)} win &middot;{" "}
                {formatPercent(hero.pickRate)} pick
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </>
  );
}

type PickView = "best" | "worst";

const VIEW_LABELS: Record<PickView, string> = {
  best: "Best picks",
  worst: "Worst picks",
};

export function MapBestPicks({
  heroes,
  mapName,
  linkSuffix,
}: MapBestPicksProps) {
  const [view, setView] = useState<PickView>("best");
  const roles = picksByRole(heroes);
  if (roles.length === 0) {
    return null;
  }
  return (
    <section className="section" aria-labelledby="best-picks-heading">
      <div className="section__heading">
        <h2 id="best-picks-heading">
          {VIEW_LABELS[view]} on {mapName}
        </h2>
        <div className="segmented" role="group" aria-label="Picks to show">
          {(Object.keys(VIEW_LABELS) as PickView[]).map((value) => (
            <button
              key={value}
              type="button"
              className={clsx("segmented__item", {
                "segmented__item--active": view === value,
              })}
              aria-pressed={view === value}
              onClick={() => setView(value)}
            >
              {VIEW_LABELS[value]}
            </button>
          ))}
        </div>
      </div>
      <div className="highlights">
        {roles.map(({ role, gainers, strongest, droppers, weakest }) => (
          <section
            key={role}
            className="highlight"
            aria-label={`${role.toLowerCase()} picks`}
          >
            <h3>
              <RoleBadge role={role} />
            </h3>
            <PickList
              title={
                view === "best" ? "Biggest gain here" : "Biggest drop here"
              }
              heroes={view === "best" ? gainers : droppers}
              linkSuffix={linkSuffix}
            />
            <PickList
              title={
                view === "best"
                  ? "Highest win rate here"
                  : "Lowest win rate here"
              }
              heroes={view === "best" ? strongest : weakest}
              linkSuffix={linkSuffix}
            />
          </section>
        ))}
      </div>
      <p className="muted footnote">
        Each hero shows the win rate on this map, how often the hero is picked
        and, as the coloured number, how much the win rate differs from the
        hero&apos;s all-maps win rate. Both lists are weighted by how often the
        hero is picked, so rarely played heroes do not top them by chance.
        Differences under 0.5 points are within noise.
      </p>
    </section>
  );
}
