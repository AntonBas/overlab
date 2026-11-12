import { useState } from "react";
import { EmptyState } from "../../../components/ui/EmptyState";
import { HeroPortrait } from "../../../components/ui/HeroPortrait";
import { IconSelect } from "../../../components/ui/IconSelect";
import type { IconSelectOption } from "../../../components/ui/IconSelect";
import { ModeIcon } from "../../../components/ui/ModeIcon";
import { useHeroPortraits, useMapVisuals } from "../../../hooks/useCatalog";
import type { Guide, GuideKind } from "../../../types/guide";
import { GUIDE_KIND_LABELS, GUIDE_KINDS } from "../labels";
import { SpotRail } from "./SpotRail";

type GroupBy = "hero" | "map" | "none";

const ALL = "all";

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
  const kindOptions: IconSelectOption<string>[] = [
    { value: ALL, label: "All types" },
    ...kinds.map((kind: GuideKind) => ({
      value: kind,
      label: `${GUIDE_KIND_LABELS[kind]} (${guides.filter((guide) => guide.kind === kind).length})`,
    })),
  ];
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
              onChange={setGroupFilter}
            />
          )}
          {showKindSelect && (
            <IconSelect
              label="Type"
              value={kindFilter}
              options={kindOptions}
              onChange={setKindFilter}
            />
          )}
        </div>
      )}
      {guides.length === 0 ? (
        <EmptyState>{emptyMessage}</EmptyState>
      ) : visible.length === 0 ? (
        <EmptyState>No spots match these filters.</EmptyState>
      ) : (
        <SpotRail
          guides={visible}
          showHero={groupBy === "hero"}
          showMap={groupBy !== "hero"}
          heroPortraits={heroPortraits}
          mapVisuals={mapVisuals}
        />
      )}
    </section>
  );
}
