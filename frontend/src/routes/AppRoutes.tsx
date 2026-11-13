import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "../components/layout/Layout";
import { GuidePage } from "../features/guides";
import { BusinessPage } from "../features/feedback";
import { FeedbackPage } from "../features/feedback";
import { HeroPage } from "../features/heroes";
import { HeroesPage } from "../features/heroes";
import { CountersPage } from "../features/relations";
import { HeroOnMapRedirect } from "../features/heroes";
import { PerksPage } from "../features/perks";
import { HeroSectionRedirect } from "../features/heroes";
import { ChangesPage } from "../features/history";
import { MapPage } from "../features/maps";
import { MapsPage } from "../features/maps";
import { StatsPage } from "../features/stats";
import { CookiesPage } from "../features/legal";
import { PrivacyPage } from "../features/legal";
import { TermsPage } from "../features/legal";
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
  import("../features/guides/admin/pages/GuidesAdminPage").then((module) => ({
    default: module.GuidesAdminPage,
  })),
);
const AbilitiesAdminPage = lazy(() =>
  import("../features/abilities/admin/pages/AbilitiesAdminPage").then(
    (module) => ({
      default: module.AbilitiesAdminPage,
    }),
  ),
);
const HeroesAdminPage = lazy(() =>
  import("../features/heroes/admin/pages/HeroesAdminPage").then((module) => ({
    default: module.HeroesAdminPage,
  })),
);
const MapsAdminPage = lazy(() =>
  import("../features/maps/admin/pages/MapsAdminPage").then((module) => ({
    default: module.MapsAdminPage,
  })),
);
const PatchesAdminPage = lazy(() =>
  import("../features/patches/admin/pages/PatchesAdminPage").then((module) => ({
    default: module.PatchesAdminPage,
  })),
);
const PerksAdminPage = lazy(() =>
  import("../features/perks/admin/pages/PerksAdminPage").then((module) => ({
    default: module.PerksAdminPage,
  })),
);
const CategoriesAdminPage = lazy(() =>
  import("../features/relations/admin/pages/CategoriesAdminPage").then(
    (module) => ({
      default: module.CategoriesAdminPage,
    }),
  ),
);
const FeedbackAdminPage = lazy(() =>
  import("../features/feedback/admin/pages/FeedbackAdminPage").then(
    (module) => ({
      default: module.FeedbackAdminPage,
    }),
  ),
);
const RelationsAdminPage = lazy(() =>
  import("../features/relations/admin/pages/RelationsAdminPage").then(
    (module) => ({
      default: module.RelationsAdminPage,
    }),
  ),
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
const MyLibraryPage = lazy(() =>
  import("../features/personal/pages/MyLibraryPage").then((module) => ({
    default: module.MyLibraryPage,
  })),
);
const SettingsPage = lazy(() =>
  import("../features/account/pages/SettingsPage").then((module) => ({
    default: module.SettingsPage,
  })),
);
const UsersAdminPage = lazy(() =>
  import("../features/admin/pages/UsersAdminPage").then((module) => ({
    default: module.UsersAdminPage,
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
        <Route path="counters" element={<CountersPage />} />
        <Route
          path="heroes/:slug/counters"
          element={<HeroSectionRedirect section="counters" />}
        />
        <Route
          path="heroes/:slug/maps"
          element={<HeroSectionRedirect section="maps" />}
        />
        <Route path="perks" element={<PerksPage />} />
        <Route
          path="heroes/:slug/perks"
          element={<HeroSectionRedirect section="perks" />}
        />
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
