import type { MapMode } from "../../types/map";

function modeIconUrl(mode: MapMode): string {
  return `/images/modes/${mode.toLowerCase()}.svg`;
}

export function ModeIcon({ mode }: { mode: MapMode }) {
  const url = `url(${modeIconUrl(mode)})`;
  return (
    <span
      className="mode-icon"
      aria-hidden="true"
      style={{ maskImage: url, WebkitMaskImage: url }}
    />
  );
}
