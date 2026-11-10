import { Navigate, useParams } from "react-router-dom";

interface HeroSectionRedirectProps {
  section: "perks" | "counters" | "maps";
}

export function HeroSectionRedirect({ section }: HeroSectionRedirectProps) {
  const { slug = "" } = useParams();
  return <Navigate to={`/heroes/${slug}#${section}`} replace />;
}
