import { lazy } from "react";
import { lazyNamed } from "./lazyNamed";
import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "../components/layout/Layout";
import { HeroOnMapRedirect } from "../features/heroes/pages/HeroOnMapRedirect";
import { StatsPage } from "../features/stats";
import { NotFoundPage } from "../pages/NotFoundPage";

const GuidePage = lazyNamed(
  () => import("../features/guides/pages/GuidePage"),
  "GuidePage",
);
const BusinessPage = lazyNamed(
  () => import("../features/feedback/pages/BusinessPage"),
  "BusinessPage",
);
const FeedbackPage = lazyNamed(
  () => import("../features/feedback/pages/FeedbackPage"),
  "FeedbackPage",
);
const HeroPage = lazyNamed(
  () => import("../features/heroes/pages/HeroPage"),
  "HeroPage",
);
const HeroesPage = lazyNamed(
  () => import("../features/heroes/pages/HeroesPage"),
  "HeroesPage",
);
const CountersPage = lazyNamed(
  () => import("../features/relations/pages/CountersPage"),
  "CountersPage",
);
const HeroCountersPage = lazyNamed(
  () => import("../features/relations/pages/HeroCountersPage"),
  "HeroCountersPage",
);
const HeroMapsPage = lazyNamed(
  () => import("../features/heroes/pages/HeroMapsPage"),
  "HeroMapsPage",
);
const HeroPerksPage = lazyNamed(
  () => import("../features/perks/pages/HeroPerksPage"),
  "HeroPerksPage",
);
const PerksPage = lazyNamed(
  () => import("../features/perks/pages/PerksPage"),
  "PerksPage",
);
const ChangesPage = lazyNamed(
  () => import("../features/history/pages/ChangesPage"),
  "ChangesPage",
);
const MapPage = lazyNamed(
  () => import("../features/maps/pages/MapPage"),
  "MapPage",
);
const MapsPage = lazyNamed(
  () => import("../features/maps/pages/MapsPage"),
  "MapsPage",
);
const CookiesPage = lazyNamed(
  () => import("../features/legal/pages/CookiesPage"),
  "CookiesPage",
);
const PrivacyPage = lazyNamed(
  () => import("../features/legal/pages/PrivacyPage"),
  "PrivacyPage",
);
const TermsPage = lazyNamed(
  () => import("../features/legal/pages/TermsPage"),
  "TermsPage",
);

const ForgotPasswordPage = lazyNamed(
  () => import("../features/auth/pages/ForgotPasswordPage"),
  "ForgotPasswordPage",
);
const LoginPage = lazyNamed(
  () => import("../features/auth/pages/LoginPage"),
  "LoginPage",
);
const RegisterPage = lazyNamed(
  () => import("../features/auth/pages/RegisterPage"),
  "RegisterPage",
);
const ResetPasswordPage = lazyNamed(
  () => import("../features/auth/pages/ResetPasswordPage"),
  "ResetPasswordPage",
);
const VerifyEmailPage = lazyNamed(
  () => import("../features/auth/pages/VerifyEmailPage"),
  "VerifyEmailPage",
);
const AuditAdminPage = lazyNamed(
  () => import("../features/admin/pages/AuditAdminPage"),
  "AuditAdminPage",
);
const CollectorAdminPage = lazyNamed(
  () => import("../features/admin/pages/CollectorAdminPage"),
  "CollectorAdminPage",
);
const GuidesAdminPage = lazyNamed(
  () => import("../features/guides/admin/pages/GuidesAdminPage"),
  "GuidesAdminPage",
);
const AbilitiesAdminPage = lazyNamed(
  () => import("../features/abilities/admin/pages/AbilitiesAdminPage"),
  "AbilitiesAdminPage",
);
const HeroesAdminPage = lazyNamed(
  () => import("../features/heroes/admin/pages/HeroesAdminPage"),
  "HeroesAdminPage",
);
const MapsAdminPage = lazyNamed(
  () => import("../features/maps/admin/pages/MapsAdminPage"),
  "MapsAdminPage",
);
const PatchesAdminPage = lazyNamed(
  () => import("../features/patches/admin/pages/PatchesAdminPage"),
  "PatchesAdminPage",
);
const PerksAdminPage = lazyNamed(
  () => import("../features/perks/admin/pages/PerksAdminPage"),
  "PerksAdminPage",
);
const CategoriesAdminPage = lazyNamed(
  () => import("../features/relations/admin/pages/CategoriesAdminPage"),
  "CategoriesAdminPage",
);
const FeedbackAdminPage = lazyNamed(
  () => import("../features/feedback/admin/pages/FeedbackAdminPage"),
  "FeedbackAdminPage",
);
const RelationsAdminPage = lazyNamed(
  () => import("../features/relations/admin/pages/RelationsAdminPage"),
  "RelationsAdminPage",
);
const AdminHomePage = lazyNamed(
  () => import("../features/admin/pages/AdminHomePage"),
  "AdminHomePage",
);
const AdminLayout = lazyNamed(
  () => import("../features/admin/components/AdminLayout"),
  "AdminLayout",
);
const MyLibraryPage = lazyNamed(
  () => import("../features/personal/pages/MyLibraryPage"),
  "MyLibraryPage",
);
const ConfirmDeletionPage = lazyNamed(
  () => import("../features/account/pages/ConfirmDeletionPage"),
  "ConfirmDeletionPage",
);
const SettingsPage = lazyNamed(
  () => import("../features/account/pages/SettingsPage"),
  "SettingsPage",
);
const UsersAdminPage = lazyNamed(
  () => import("../features/admin/pages/UsersAdminPage"),
  "UsersAdminPage",
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
        <Route path="counters" element={<CountersPage />} />
        <Route path="heroes/:slug/counters" element={<HeroCountersPage />} />
        <Route path="heroes/:slug/maps" element={<HeroMapsPage />} />
        <Route path="perks" element={<PerksPage />} />
        <Route path="heroes/:slug/perks" element={<HeroPerksPage />} />
        <Route path="maps/:map/:hero" element={<HeroOnMapRedirect />} />
        <Route path="changes" element={<ChangesPage />} />
        <Route path="patches/*" element={<Navigate to="/changes" replace />} />
        <Route path="maps" element={<MapsPage />} />
        <Route path="maps/:slug" element={<MapPage />} />
        <Route path="guides/:path" element={<GuidePage />} />
        <Route path="feedback" element={<FeedbackPage />} />
        <Route path="business" element={<BusinessPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="cookies" element={<CookiesPage />} />
        <Route path="me" element={<MyLibraryPage />} />
        <Route path="me/settings" element={<SettingsPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="verify-email" element={<VerifyEmailPage />} />
        <Route path="confirm-deletion" element={<ConfirmDeletionPage />} />
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
          <Route path="abilities" element={<AbilitiesAdminPage />} />
          <Route path="perks" element={<PerksAdminPage />} />
          <Route path="relations" element={<RelationsAdminPage />} />
          <Route path="feedback" element={<FeedbackAdminPage />} />
          <Route path="categories" element={<CategoriesAdminPage />} />
          <Route path="guides" element={<GuidesAdminPage />} />
          <Route path="patches" element={<PatchesAdminPage />} />
          <Route path="maps" element={<MapsAdminPage />} />
          <Route path="collector" element={<CollectorAdminPage />} />
          <Route path="users" element={<UsersAdminPage />} />
          <Route path="audit" element={<AuditAdminPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
