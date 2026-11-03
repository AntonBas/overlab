import { Navigate, useParams, useSearchParams } from "react-router-dom";
import { heroOnMapPath } from "../utils/heroOnMapPath";

export function HeroOnMapRedirect() {
  const { map = "", hero = "" } = useParams();
  const [searchParams] = useSearchParams();
  const suffix = searchParams.get("queue") === "quick_play" ? "quick_play" : "";
  return <Navigate to={heroOnMapPath(hero, map, suffix)} replace />;
}
