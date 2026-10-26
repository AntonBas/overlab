import { Navigate } from "react-router-dom";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Spinner } from "../../../components/ui/Spinner";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { useAuth } from "../../auth/context/useAuth";
import { DeleteAccount } from "../components/DeleteAccount";
import { EmailForm } from "../components/EmailForm";
import { ExportAccount } from "../components/ExportAccount";
import { PasswordForm } from "../components/PasswordForm";
import { ProfileForm } from "../components/ProfileForm";
import { SettingsSection } from "../components/SettingsSection";

export function SettingsPage() {
  usePageTitle("Account settings");
  const { user, loading } = useAuth();

  if (loading) {
    return <Spinner />;
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: "/me/settings" }} />;
  }

  return (
    <div className="settings">
      <PageHeader title="Account settings" subtitle={user.email} />
      <SettingsSection title="Profile">
        <ProfileForm />
      </SettingsSection>
      {user.provider === "LOCAL" ? (
        <>
          <SettingsSection title="Password">
            <PasswordForm />
          </SettingsSection>
          <SettingsSection title="Email">
            <EmailForm currentEmail={user.email} />
          </SettingsSection>
        </>
      ) : (
        <SettingsSection title="Sign-in">
          <p>
            This account signs in with Google, so there is no password or email
            to change here.
          </p>
        </SettingsSection>
      )}
      <SettingsSection
        title="Your data"
        description="Download everything we store about your account as a JSON file."
      >
        <ExportAccount />
      </SettingsSection>
      <SettingsSection title="Delete account">
        <DeleteAccount />
      </SettingsSection>
    </div>
  );
}
