import { Navigate, useParams } from "react-router-dom";

export function HeroCountersRedirect() {
  const { slug = "" } = useParams();
  return <Navigate to={`/heroes/${slug}`} replace />;
}
