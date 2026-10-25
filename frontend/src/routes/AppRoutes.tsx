import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "../components/layout/Layout";
import { AdminLayout } from "../features/admin/components/AdminLayout";
import { RequireAdmin } from "../features/admin/components/RequireAdmin";
import { AdminHomePage } from "../features/admin/pages/AdminHomePage";
import { AuditAdminPage } from "../features/admin/pages/AuditAdminPage";
import { CollectorAdminPage } from "../features/admin/pages/CollectorAdminPage";
import { GuidesAdminPage } from "../features/admin/pages/GuidesAdminPage";
import { HeroesAdminPage } from "../features/admin/pages/HeroesAdminPage";
import { MapsAdminPage } from "../features/admin/pages/MapsAdminPage";
import { PatchesAdminPage } from "../features/admin/pages/PatchesAdminPage";
import { PerksAdminPage } from "../features/admin/pages/PerksAdminPage";
import { RelationsAdminPage } from "../features/admin/pages/RelationsAdminPage";
import { ForgotPasswordPage } from "../features/auth/pages/ForgotPasswordPage";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { RegisterPage } from "../features/auth/pages/RegisterPage";
import { ResetPasswordPage } from "../features/auth/pages/ResetPasswordPage";
import { VerifyEmailPage } from "../features/auth/pages/VerifyEmailPage";
import { GuidePage } from "../features/guides/pages/GuidePage";
import { HeroPage } from "../features/heroes/pages/HeroPage";
import { HeroesPage } from "../features/heroes/pages/HeroesPage";
import { MapPage } from "../features/maps/pages/MapPage";
import { MapsPage } from "../features/maps/pages/MapsPage";
import { StatsPage } from "../features/stats/pages/StatsPage";
import { NotFoundPage } from "../pages/NotFoundPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/stats" replace />} />
        <Route path="stats" element={<StatsPage />} />
        <Route path="heroes" element={<HeroesPage />} />
        <Route path="heroes/:slug" element={<HeroPage />} />
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
