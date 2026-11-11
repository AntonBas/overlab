import clsx from "clsx";
import { REGIONS } from "../../features/stats/filters";
import type { Region } from "../../types/api";
import { REGION_LABELS } from "../../utils/format";

interface RegionToggleProps {
  value: Region;
  onChange: (region: Region) => void;
}

export function RegionToggle({ value, onChange }: RegionToggleProps) {
  return (
    <div className="segmented" role="group" aria-label="Region">
      {REGIONS.map((region) => (
        <button
          key={region}
          type="button"
          className={clsx("segmented__item", {
            "segmented__item--active": value === region,
          })}
          aria-pressed={value === region}
          onClick={() => onChange(region)}
        >
          {REGION_LABELS[region]}
        </button>
      ))}
    </div>
  );
}
