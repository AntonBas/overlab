import { AllItemsIcon } from "../../../components/ui/AllItemsIcon";
import { HeroPortrait } from "../../../components/ui/HeroPortrait";
import type { IconSelectOption } from "../../../components/ui/IconSelect";
import { ModeIcon } from "../../../components/ui/ModeIcon";
import { Thumbnail } from "../../../components/ui/Thumbnail";
import type { MapVisual } from "../../../hooks/useCatalog";
import type { Guide, GuideKind } from "../../../types/guide";
import { GUIDE_KIND_ICONS, GUIDE_KIND_LABELS, GUIDE_KINDS } from "../labels";

export const ALL = "all";
const MAP_ICON_SIZE = 24;
const HERO_ICON_SIZE = 20;
const ANY_MAP_LABEL = "Any map";

interface Group {
  key: string;
  label: string;
  count: number;
}

function countGroups(
  guides: Guide[],
  keyOf: (guide: Guide) => string,
  labelOf: (guide: Guide) => string,
): Group[] {
  const groups = new Map<string, Group>();
  guides.forEach((guide) => {
    const key = keyOf(guide);
    const known = groups.get(key);
    groups.set(key, {
      key,
      label: labelOf(guide),
      count: (known?.count ?? 0) + 1,
    });
  });
  return [...groups.values()].sort((first, second) =>
    first.label.localeCompare(second.label),
  );
}

export function heroOptions(
  guides: Guide[],
  portraits: Record<string, string | null>,
): IconSelectOption<string>[] {
  return [
    {
      value: ALL,
      label: `All heroes (${guides.length})`,
      icon: <AllItemsIcon />,
    },
    ...countGroups(
      guides,
      (guide) => guide.heroSlug,
      (guide) => guide.heroName,
    ).map((group) => ({
      value: group.key,
      label: `${group.label} (${group.count})`,
      icon: (
        <HeroPortrait
          name={group.label}
          url={portraits[group.key] ?? null}
          size={HERO_ICON_SIZE}
        />
      ),
    })),
  ];
}

export function mapOptions(
  guides: Guide[],
  visuals: Record<string, MapVisual>,
): IconSelectOption<string>[] {
  return [
    {
      value: ALL,
      label: `All maps (${guides.length})`,
      icon: <AllItemsIcon />,
    },
    ...countGroups(
      guides,
      (guide) => guide.mapSlug ?? "",
      (guide) => guide.mapName ?? ANY_MAP_LABEL,
    ).map((group) => {
      const visual = visuals[group.key];
      return {
        value: group.key,
        label: `${group.label} (${group.count})`,
        icon: visual?.imageUrl ? (
          <Thumbnail
            url={visual.imageUrl}
            width={MAP_ICON_SIZE}
            height={MAP_ICON_SIZE}
          />
        ) : visual?.mode ? (
          <ModeIcon mode={visual.mode} />
        ) : undefined,
      };
    }),
  ];
}

export function kindOptions(guides: Guide[]): IconSelectOption<string>[] {
  return [
    { value: ALL, label: "All types", icon: <AllItemsIcon /> },
    ...GUIDE_KINDS.filter((kind) =>
      guides.some((guide) => guide.kind === kind),
    ).map((kind: GuideKind) => {
      const KindIcon = GUIDE_KIND_ICONS[kind];
      return {
        value: kind,
        icon: <KindIcon size={16} aria-hidden="true" />,
        label: `${GUIDE_KIND_LABELS[kind]} (${guides.filter((guide) => guide.kind === kind).length})`,
      };
    }),
  ];
}
