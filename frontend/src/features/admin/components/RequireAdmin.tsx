import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Spinner } from "../../../components/ui/Spinner";
import { useAuth } from "../../auth/context/useAuth";
import { ForbiddenPage } from "../pages/ForbiddenPage";

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Spinner />;
  }
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }
  if (user.role !== "ADMIN") {
    return <ForbiddenPage />;
  }
  return <>{children}</>;
}
