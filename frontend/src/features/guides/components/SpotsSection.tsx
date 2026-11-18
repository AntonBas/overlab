import { useState } from "react";
import { Carousel } from "../../../components/ui/Carousel";
import { EmptyState } from "../../../components/ui/EmptyState";
import { IconSelect } from "../../../components/ui/IconSelect";
import { SectionLink } from "../../../components/ui/SectionLink";
import { useHeroPortraits, useMapVisuals } from "../../../hooks/useCatalog";
import type { Guide } from "../../../types/guide";
import {
  ALL,
  heroOptions,
  kindOptions as buildKindOptions,
  mapOptions,
} from "../utils/spotFilterOptions";
import { SpotCard } from "./SpotCard";

type GroupBy = "hero" | "map" | "none";

const SPOTS_PER_ROW = 3;
const SPOT_ROWS = 2;

interface SpotsSectionProps {
  title: string;
  description?: string;
  guides: Guide[];
  groupBy: GroupBy;
  emptyMessage: string;
  expanded?: boolean;
  moreHref?: string;
  moreLabel?: string;
}

function groupKey(guide: Guide, groupBy: GroupBy): string {
  if (groupBy === "hero") {
    return guide.heroSlug;
  }
  return groupBy === "map" ? (guide.mapSlug ?? "") : "";
}

export function SpotsSection({
  title,
  description,
  guides,
  groupBy,
  emptyMessage,
  expanded = false,
  moreHref,
  moreLabel = "All guides",
}: SpotsSectionProps) {
  const [groupFilter, setGroupFilter] = useState<string>(ALL);
  const [kindFilter, setKindFilter] = useState<string>(ALL);
  const heroPortraits = useHeroPortraits();
  const mapVisuals = useMapVisuals();

  const visible = guides.filter(
    (guide) =>
      (groupFilter === ALL || groupKey(guide, groupBy) === groupFilter) &&
      (kindFilter === ALL || guide.kind === kindFilter),
  );

  const groupOptions =
    groupBy === "hero"
      ? heroOptions(guides, heroPortraits)
      : mapOptions(guides, mapVisuals);
  const kindOptions = buildKindOptions(guides);
  const filtered = groupFilter !== ALL || kindFilter !== ALL;

  function changeGroup(value: string) {
    setGroupFilter(value);
  }

  function changeKind(value: string) {
    setKindFilter(value);
  }

  function resetFilters() {
    changeGroup(ALL);
    changeKind(ALL);
  }
  const showGroupSelect = groupBy !== "none" && groupOptions.length > 2;
  const showKindSelect = kindOptions.length > 2;

  return (
    <section
      className="section"
      aria-labelledby={expanded ? undefined : "spots-heading"}
      aria-label={expanded ? title : undefined}
    >
      {!expanded && (
        <div className="section__heading">
          <div className="section__title">
            <h2 id="spots-heading">{title}</h2>
            {description && (
              <p className="muted section__description">{description}</p>
            )}
          </div>
          {moreHref && guides.length > SPOTS_PER_ROW * SPOT_ROWS && (
            <SectionLink to={moreHref}>{moreLabel}</SectionLink>
          )}
        </div>
      )}
      {(showGroupSelect || showKindSelect) && (
        <div className="spot-filters">
          {showGroupSelect && (
            <IconSelect
              label={groupBy === "hero" ? "Hero" : "Map"}
              value={groupFilter}
              options={groupOptions}
              searchable
              onChange={changeGroup}
            />
          )}
          {showKindSelect && (
            <IconSelect
              label="Type"
              value={kindFilter}
              options={kindOptions}
              onChange={changeKind}
            />
          )}
        </div>
      )}
      {guides.length === 0 ? (
        <EmptyState>{emptyMessage}</EmptyState>
      ) : visible.length === 0 ? (
        <EmptyState kind="no-match">
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
          {expanded ? (
            <ul className="spot-grid">
              {visible.map((guide) => (
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
          ) : (
            <Carousel
              items={visible.map((guide) => ({
                key: guide.id,
                content: (
                  <SpotCard
                    guide={guide}
                    showHero={groupBy === "hero"}
                    showMap={groupBy !== "hero"}
                    heroPortraits={heroPortraits}
                    mapVisuals={mapVisuals}
                  />
                ),
              }))}
              itemsPerView={SPOTS_PER_ROW}
              rows={SPOT_ROWS}
              previousLabel="Previous spots"
              nextLabel="Next spots"
              resetKey={`${groupFilter}|${kindFilter}`}
            />
          )}
        </>
      )}
    </section>
  );
}
