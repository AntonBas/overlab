import { FormError } from "../../../components/ui/FormError";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { StatusMessage } from "../../../components/admin/StatusMessage";
import { useSave } from "../../../components/admin/useSave";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Spinner } from "../../../components/ui/Spinner";
import { useNoIndex } from "../../../hooks/useNoIndex";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { useAuth } from "../../auth";
import { deleteAccount } from "../api/accountApi";

export function ConfirmDeletionPage() {
  usePageTitle("Confirm account deletion");
  useNoIndex();
  const { user, loading, replaceUser } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const save = useSave();

  if (loading) {
    return <Spinner page label="Checking your session" />;
  }
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `/confirm-deletion?token=${encodeURIComponent(token)}` }}
      />
    );
  }

  async function confirm() {
    const deleted = await save.run(
      () => deleteAccount(null, token),
      "Account deleted.",
    );
    if (deleted) {
      replaceUser(null);
      navigate("/", { replace: true });
    }
  }

  return (
    <div className="settings">
      <PageHeader title="Confirm account deletion" />
      {token === "" ? (
        <FormError>This confirmation link is incomplete.</FormError>
      ) : (
        <>
          <p>
            This permanently deletes the account {user.email} and its personal
            data. This cannot be undone.
          </p>
          <StatusMessage error={save.error} />
          <button
            type="button"
            className="button button--danger"
            disabled={save.saving}
            onClick={() => void confirm()}
          >
            Delete permanently
          </button>
        </>
      )}
    </div>
  );
}
