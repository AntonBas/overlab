import clsx from "clsx";
import { Link } from "react-router-dom";
import type { HeroRole } from "../../types/hero";
import { HeroPortrait } from "./HeroPortrait";

export type HighlightTone = "win" | "pick" | "ban" | "up" | "down";

export interface HeroHighlight {
  key: string;
  label: string;
  heroSlug: string;
  heroName: string;
  role: HeroRole;
  portraitUrl: string | null;
  value: string;
  tone: HighlightTone;
}

interface HeroHighlightsProps {
  items: HeroHighlight[];
  heroLinkSuffix?: string;
}

export function HeroHighlights({
  items,
  heroLinkSuffix = "",
}: HeroHighlightsProps) {
  if (items.length === 0) {
    return null;
  }
  return (
    <ul className="hero-highlights">
      {items.map((item) => (
        <li key={item.key}>
          <Link
            className={clsx(
              "hero-highlight",
              `hero-highlight--${item.tone}`,
              `hero-highlight--${item.role.toLowerCase()}`,
            )}
            to={`/heroes/${item.heroSlug}${heroLinkSuffix}`}
            aria-label={`${item.label}: ${item.heroName}, ${item.value}`}
          >
            <HeroPortrait
              name={item.heroName}
              url={item.portraitUrl}
              size={52}
            />
            <span className="hero-highlight__text">
              <span className="hero-highlight__label">{item.label}</span>
              <strong className="hero-highlight__name">{item.heroName}</strong>
              <span className="hero-highlight__value">{item.value}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
