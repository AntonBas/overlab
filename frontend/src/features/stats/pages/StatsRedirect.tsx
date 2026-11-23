import { Navigate, useLocation } from "react-router-dom";

export function StatsRedirect() {
  const { search } = useLocation();
  return <Navigate to={{ pathname: "/", search }} replace />;
}
