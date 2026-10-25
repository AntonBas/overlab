import { Link } from "react-router-dom";
import { PageHeader } from "../../../components/ui/PageHeader";
import type { Hero } from "../../../types/api";

interface HeroSubpageHeaderProps {
  hero: Hero;
  title: string;
}

export function HeroSubpageHeader({ hero, title }: HeroSubpageHeaderProps) {
  return (
    <PageHeader
      title={`${hero.name}: ${title}`}
      subtitle={<Link to={`/heroes/${hero.slug}`}>Back to {hero.name}</Link>}
    />
  );
}
