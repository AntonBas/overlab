import clsx from "clsx";
import { useId, type KeyboardEvent } from "react";
import { useSearchParams } from "react-router-dom";
import type { RelatedHero } from "../../../types/api";
import { RelatedHeroes } from "./RelatedHeroes";

type RelationTabId = "strong" | "struggles" | "synergies";

interface RelationTab {
  id: RelationTabId;
  label: string;
  heroes: RelatedHero[];
}

interface RelationTabsProps {
  strongAgainst: RelatedHero[];
  counteredBy: RelatedHero[];
  synergies: RelatedHero[];
}

const PREFERRED_TAB: RelationTabId = "struggles";

export function RelationTabs({
  strongAgainst,
  counteredBy,
  synergies,
}: RelationTabsProps) {
  const baseId = useId();
  const [searchParams, setSearchParams] = useSearchParams();
  const allTabs: RelationTab[] = [
    { id: "strong", label: "Strong against", heroes: strongAgainst },
    { id: "struggles", label: "Struggles against", heroes: counteredBy },
    { id: "synergies", label: "Works well with", heroes: synergies },
  ];
  const tabs = allTabs.filter((tab) => tab.heroes.length > 0);

  if (tabs.length === 0) {
    return null;
  }

  const requested = searchParams.get("tab");
  const active =
    tabs.find((tab) => tab.id === requested) ??
    tabs.find((tab) => tab.id === PREFERRED_TAB) ??
    tabs[0];

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

  return (
    <section className="section">
      <h2>Counters and synergies</h2>
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
            <span className="segmented__count">{tab.heroes.length}</span>
          </button>
        ))}
      </div>
      <div
        id={`${baseId}-panel`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${active.id}`}
        className="relation-tabs__panel"
      >
        <RelatedHeroes heroes={active.heroes} />
      </div>
    </section>
  );
}
