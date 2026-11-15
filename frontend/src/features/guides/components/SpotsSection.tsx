import clsx from "clsx";
import { useState } from "react";
import { EmptyState } from "../../../components/ui/EmptyState";
import { HeroPortrait } from "../../../components/ui/HeroPortrait";
import { IconSelect } from "../../../components/ui/IconSelect";
import type { IconSelectOption } from "../../../components/ui/IconSelect";
import { ModeIcon } from "../../../components/ui/ModeIcon";
import { useHeroPortraits, useMapVisuals } from "../../../hooks/useCatalog";
import type { Guide, GuideKind } from "../../../types/guide";
import { GUIDE_KIND_LABELS, GUIDE_KINDS } from "../labels";
import { SpotCard } from "./SpotCard";

type GroupBy = "hero" | "map" | "none";

const ALL = "all";
const INITIAL_LIMIT = 6;

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

function groupOf(guide: Guide, groupBy: GroupBy): Omit<Group, "count"> | null {
  if (groupBy === "hero") {
    return { key: guide.heroSlug, label: guide.heroName };
  }
  if (groupBy === "map") {
    return { key: guide.mapSlug ?? "", label: guide.mapName ?? "Any map" };
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
  const [groupFilter, setGroupFilter] = useState<string>(ALL);
  const [kindFilter, setKindFilter] = useState<string>(ALL);
  const [expanded, setExpanded] = useState(false);
  const heroPortraits = useHeroPortraits();
  const mapVisuals = useMapVisuals();

  const groups = new Map<string, Group>();
  guides.forEach((guide) => {
    const group = groupOf(guide, groupBy);
    if (group) {
      const known = groups.get(group.key);
      groups.set(group.key, { ...group, count: (known?.count ?? 0) + 1 });
    }
  });
  const sortedGroups = [...groups.values()].sort((first, second) =>
    first.label.localeCompare(second.label),
  );
  const kinds = GUIDE_KINDS.filter((kind) =>
    guides.some((guide) => guide.kind === kind),
  );
  const visible = guides.filter(
    (guide) =>
      (groupFilter === ALL || groupKey(guide, groupBy) === groupFilter) &&
      (kindFilter === ALL || guide.kind === kindFilter),
  );

  const groupLabel = groupBy === "hero" ? "Hero" : "Map";
  const allGroupsLabel = groupBy === "hero" ? "All heroes" : "All maps";
  const groupOptions: IconSelectOption<string>[] = [
    {
      value: ALL,
      label: `${allGroupsLabel} (${guides.length})`,
    },
    ...sortedGroups.map((group) => ({
      value: group.key,
      label: `${group.label} (${group.count})`,
      icon:
        groupBy === "hero" ? (
          <HeroPortrait
            name={group.label}
            url={heroPortraits[group.key] ?? null}
            size={20}
          />
        ) : mapVisuals[group.key]?.mode ? (
          <ModeIcon mode={mapVisuals[group.key].mode ?? "CONTROL"} />
        ) : undefined,
    })),
  ];
  const kindOptions = [
    { value: ALL, label: "All types" },
    ...kinds.map((kind: GuideKind) => ({
      value: kind,
      label: `${GUIDE_KIND_LABELS[kind]} (${guides.filter((guide) => guide.kind === kind).length})`,
    })),
  ];
  const filtered = groupFilter !== ALL || kindFilter !== ALL;
  const shown = expanded ? visible : visible.slice(0, INITIAL_LIMIT);

  function changeGroup(value: string) {
    setGroupFilter(value);
    setExpanded(false);
  }

  function changeKind(value: string) {
    setKindFilter(value);
    setExpanded(false);
  }

  function resetFilters() {
    changeGroup(ALL);
    changeKind(ALL);
  }
  const showGroupSelect = groups.size > 1;
  const showKindSelect = kinds.length > 1;

  return (
    <section className="section" aria-labelledby="spots-heading">
      <div className="section__heading">
        <h2 id="spots-heading">{title}</h2>
      </div>
      {(showGroupSelect || showKindSelect) && (
        <div className="spot-filters">
          {showGroupSelect && (
            <IconSelect
              label={groupLabel}
              value={groupFilter}
              options={groupOptions}
              searchable
              onChange={changeGroup}
            />
          )}
          {showKindSelect && (
            <div className="field">
              <span className="field__label">Type</span>
              <div className="segmented" role="group" aria-label="Type">
                {kindOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={clsx("segmented__item", {
                      "segmented__item--active": kindFilter === option.value,
                    })}
                    aria-pressed={kindFilter === option.value}
                    onClick={() => changeKind(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {guides.length === 0 ? (
        <EmptyState>{emptyMessage}</EmptyState>
      ) : visible.length === 0 ? (
        <EmptyState>
          No spots match these filters.{" "}
          <button type="button" className="link-button" onClick={resetFilters}>
            Reset filters
          </button>
        </EmptyState>
      ) : (
        <>
          {filtered && (
            <p className="muted spot-count">
              {visible.length} of {guides.length} spots
            </p>
          )}
          <ul className="spot-grid">
            {shown.map((guide) => (
              <li key={guide.id}>
                <SpotCard
                  guide={guide}
                  showHero={groupBy === "hero"}
                  showMap={groupBy !== "hero"}
                  heroPortraits={heroPortraits}
                  mapVisuals={mapVisuals}
                />
              </li>
            ))}
          </ul>
          {visible.length > INITIAL_LIMIT && (
            <div className="spot-more">
              <button
                type="button"
                className="button button--ghost"
                aria-expanded={expanded}
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? "Show fewer" : `Show all ${visible.length} spots`}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
