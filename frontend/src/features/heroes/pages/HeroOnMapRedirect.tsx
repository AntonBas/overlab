import { Navigate, useParams, useSearchParams } from "react-router-dom";

export function HeroOnMapRedirect() {
  const { hero = "" } = useParams();
  const [searchParams] = useSearchParams();
  const suffix =
    searchParams.get("queue") === "quick_play" ? "?queue=quick_play" : "";
  return <Navigate to={`/heroes/${hero}${suffix}`} replace />;
}
