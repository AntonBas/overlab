import { HeroPortrait } from "../../../../components/ui/HeroPortrait";
import type { AdminHero } from "../types";

interface HeroLabelProps {
  slug: string;
  heroes: readonly AdminHero[];
}

export function HeroLabel({ slug, heroes }: HeroLabelProps) {
  const hero = heroes.find((candidate) => candidate.slug === slug);
  if (!hero) {
    return <>{slug}</>;
  }
  return (
    <span className="admin__name">
      <HeroPortrait name={hero.name} url={hero.portraitUrl} size={28} />
      {hero.name}
    </span>
  );
}
