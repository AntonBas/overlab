import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "../components/layout/Layout";
import { GuidePage } from "../features/guides/pages/GuidePage";
import { HeroPage } from "../features/heroes/pages/HeroPage";
import { HeroesPage } from "../features/heroes/pages/HeroesPage";
import { HeroCountersPage } from "../features/heroes/pages/HeroCountersPage";
import { HeroOnMapPage } from "../features/heroes/pages/HeroOnMapPage";
import { HeroPerksPage } from "../features/heroes/pages/HeroPerksPage";
import { ChangesPage } from "../features/history/pages/ChangesPage";
import { PatchPage } from "../features/patches/pages/PatchPage";
import { PatchesPage } from "../features/patches/pages/PatchesPage";
import { MapPage } from "../features/maps/pages/MapPage";
import { MapsPage } from "../features/maps/pages/MapsPage";
import { StatsPage } from "../features/stats/pages/StatsPage";
import { NotFoundPage } from "../pages/NotFoundPage";

const ForgotPasswordPage = lazy(() =>
  import("../features/auth/pages/ForgotPasswordPage").then((module) => ({
    default: module.ForgotPasswordPage,
  })),
);
const LoginPage = lazy(() =>
  import("../features/auth/pages/LoginPage").then((module) => ({
    default: module.LoginPage,
  })),
);
const RegisterPage = lazy(() =>
  import("../features/auth/pages/RegisterPage").then((module) => ({
    default: module.RegisterPage,
  })),
);
const ResetPasswordPage = lazy(() =>
  import("../features/auth/pages/ResetPasswordPage").then((module) => ({
    default: module.ResetPasswordPage,
  })),
);
const VerifyEmailPage = lazy(() =>
  import("../features/auth/pages/VerifyEmailPage").then((module) => ({
    default: module.VerifyEmailPage,
  })),
);
const AuditAdminPage = lazy(() =>
  import("../features/admin/pages/AuditAdminPage").then((module) => ({
    default: module.AuditAdminPage,
  })),
);
const CollectorAdminPage = lazy(() =>
  import("../features/admin/pages/CollectorAdminPage").then((module) => ({
    default: module.CollectorAdminPage,
  })),
);
const GuidesAdminPage = lazy(() =>
  import("../features/admin/pages/GuidesAdminPage").then((module) => ({
    default: module.GuidesAdminPage,
  })),
);
const HeroesAdminPage = lazy(() =>
  import("../features/admin/pages/HeroesAdminPage").then((module) => ({
    default: module.HeroesAdminPage,
  })),
);
const MapsAdminPage = lazy(() =>
  import("../features/admin/pages/MapsAdminPage").then((module) => ({
    default: module.MapsAdminPage,
  })),
);
const PatchesAdminPage = lazy(() =>
  import("../features/admin/pages/PatchesAdminPage").then((module) => ({
    default: module.PatchesAdminPage,
  })),
);
const PerksAdminPage = lazy(() =>
  import("../features/admin/pages/PerksAdminPage").then((module) => ({
    default: module.PerksAdminPage,
  })),
);
const RelationsAdminPage = lazy(() =>
  import("../features/admin/pages/RelationsAdminPage").then((module) => ({
    default: module.RelationsAdminPage,
  })),
);
const AdminHomePage = lazy(() =>
  import("../features/admin/pages/AdminHomePage").then((module) => ({
    default: module.AdminHomePage,
  })),
);
const AdminLayout = lazy(() =>
  import("../features/admin/components/AdminLayout").then((module) => ({
    default: module.AdminLayout,
  })),
);
const RequireAdmin = lazy(() =>
  import("../features/admin/components/RequireAdmin").then((module) => ({
    default: module.RequireAdmin,
  })),
);

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/stats" replace />} />
        <Route path="stats" element={<StatsPage />} />
        <Route path="heroes" element={<HeroesPage />} />
        <Route path="heroes/:slug" element={<HeroPage />} />
        <Route path="heroes/:slug/counters" element={<HeroCountersPage />} />
        <Route path="heroes/:slug/perks" element={<HeroPerksPage />} />
        <Route path="maps/:map/:hero" element={<HeroOnMapPage />} />
        <Route path="changes" element={<ChangesPage />} />
        <Route path="patches" element={<PatchesPage />} />
        <Route path="patches/:slug" element={<PatchPage />} />
        <Route path="maps" element={<MapsPage />} />
        <Route path="maps/:slug" element={<MapPage />} />
        <Route path="guides/:path" element={<GuidePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="verify-email" element={<VerifyEmailPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route
          path="admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<AdminHomePage />} />
          <Route path="heroes" element={<HeroesAdminPage />} />
          <Route path="perks" element={<PerksAdminPage />} />
          <Route path="relations" element={<RelationsAdminPage />} />
          <Route path="guides" element={<GuidesAdminPage />} />
          <Route path="patches" element={<PatchesAdminPage />} />
          <Route path="maps" element={<MapsAdminPage />} />
          <Route path="collector" element={<CollectorAdminPage />} />
          <Route path="audit" element={<AuditAdminPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
