import clsx from "clsx";
import { useState } from "react";
import { EmptyState } from "../../../components/ui/EmptyState";
import type { Guide, GuideKind } from "../../../types/api";
import { GUIDE_KIND_LABELS, GUIDE_KINDS } from "../labels";
import { SpotRail } from "./SpotRail";

type GroupBy = "hero" | "map" | "none";

interface SpotsSectionProps {
  title: string;
  guides: Guide[];
  groupBy: GroupBy;
  emptyMessage: string;
}

interface Group {
  key: string;
  label: string;
  count: number;
}

function groupOf(guide: Guide, groupBy: GroupBy): Group | null {
  if (groupBy === "hero") {
    return { key: guide.heroSlug, label: guide.heroName, count: 1 };
  }
  if (groupBy === "map") {
    return {
      key: guide.mapSlug ?? "",
      label: guide.mapName ?? "Any map",
      count: 1,
    };
  }
  return null;
}

function groupKey(guide: Guide, groupBy: GroupBy): string {
  return groupOf(guide, groupBy)?.key ?? "";
}

export function SpotsSection({
  title,
  guides,
  groupBy,
  emptyMessage,
}: SpotsSectionProps) {
  const [groupFilter, setGroupFilter] = useState<string | null>(null);
  const [kindFilter, setKindFilter] = useState<GuideKind | null>(null);

  const groups = new Map<string, Group>();
  guides.forEach((guide) => {
    const group = groupOf(guide, groupBy);
    if (group) {
      const known = groups.get(group.key);
      groups.set(group.key, {
        ...group,
        count: (known?.count ?? 0) + 1,
      });
    }
  });
  const kinds = GUIDE_KINDS.filter((kind) =>
    guides.some((guide) => guide.kind === kind),
  );
  const visible = guides.filter(
    (guide) =>
      (groupFilter === null || groupKey(guide, groupBy) === groupFilter) &&
      (kindFilter === null || guide.kind === kindFilter),
  );

  function selectGroup(next: string | null) {
    setGroupFilter(next);
  }

  function selectKind(next: GuideKind | null) {
    setKindFilter(next);
  }

  return (
    <section className="section" aria-labelledby="spots-heading">
      <div className="section__heading">
        <h2 id="spots-heading">{title}</h2>
        {kinds.length > 1 && (
          <div className="segmented" role="group" aria-label="Type">
            <button
              type="button"
              className={clsx("segmented__item", {
                "segmented__item--active": kindFilter === null,
              })}
              aria-pressed={kindFilter === null}
              onClick={() => selectKind(null)}
            >
              All types
            </button>
            {kinds.map((kind) => (
              <button
                key={kind}
                type="button"
                className={clsx("segmented__item", {
                  "segmented__item--active": kindFilter === kind,
                })}
                aria-pressed={kindFilter === kind}
                onClick={() => selectKind(kind)}
              >
                {GUIDE_KIND_LABELS[kind]}
              </button>
            ))}
          </div>
        )}
      </div>
      {groups.size > 1 && (
        <ul className="chip-list spot-groups">
          <li>
            <button
              type="button"
              className={clsx("chip chip--button", {
                "chip--active": groupFilter === null,
              })}
              aria-pressed={groupFilter === null}
              onClick={() => selectGroup(null)}
            >
              All <span className="muted">{guides.length}</span>
            </button>
          </li>
          {[...groups.values()].map((group) => (
            <li key={group.key}>
              <button
                type="button"
                className={clsx("chip chip--button", {
                  "chip--active": groupFilter === group.key,
                })}
                aria-pressed={groupFilter === group.key}
                onClick={() => selectGroup(group.key)}
              >
                {group.label} <span className="muted">{group.count}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {guides.length === 0 ? (
        <EmptyState>{emptyMessage}</EmptyState>
      ) : visible.length === 0 ? (
        <EmptyState>No spots of this type.</EmptyState>
      ) : (
        <SpotRail
          guides={visible}
          showHero={groupBy === "hero"}
          showMap={groupBy !== "hero"}
        />
      )}
    </section>
  );
}
