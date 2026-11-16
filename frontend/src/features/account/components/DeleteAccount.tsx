import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FormField } from "../../../components/ui/FormField";
import { StatusMessage } from "../../../components/admin/StatusMessage";
import { useSave } from "../../../components/admin/useSave";
import { useAuth } from "../../auth";
import { deleteAccount, requestAccountDeletion } from "../api/accountApi";

export function DeleteAccount() {
  const { user, replaceUser } = useAuth();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const [linkSent, setLinkSent] = useState(false);
  const save = useSave();
  const needsPassword = user?.provider === "LOCAL";

  async function confirm() {
    const deleted = await save.run(
      () => deleteAccount(password, null),
      "Account deleted.",
    );
    if (deleted) {
      replaceUser(null);
      navigate("/stats", { replace: true });
    }
  }

  async function sendLink() {
    const sent = await save.run(
      requestAccountDeletion,
      "We emailed you a confirmation link.",
    );
    if (sent) {
      setLinkSent(true);
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        className="button button--danger"
        onClick={() => setConfirming(true)}
      >
        Delete my account
      </button>
    );
  }

  return (
    <div className="form">
      <p>
        This permanently deletes your account and personal data. Audit entries
        that mention you are anonymized. This cannot be undone.
      </p>
      {needsPassword && (
        <FormField
          label="Enter your password to confirm"
          name="deletePassword"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      )}
      {!needsPassword && (
        <p>
          {linkSent
            ? "We emailed you a link. Open it to finish deleting the account; it works for a limited time."
            : "To confirm, we email a deletion link to the address of your account."}
        </p>
      )}
      <StatusMessage error={save.error} />
      <div className="dialog__actions">
        <button
          type="button"
          className="button button--ghost"
          onClick={() => setConfirming(false)}
        >
          Cancel
        </button>
        {needsPassword ? (
          <button
            type="button"
            className="button button--danger"
            disabled={save.saving || password === ""}
            onClick={() => void confirm()}
          >
            Delete permanently
          </button>
        ) : (
          <button
            type="button"
            className="button button--danger"
            disabled={save.saving}
            onClick={() => void sendLink()}
          >
            {linkSent ? "Send the link again" : "Email me the link"}
          </button>
        )}
      </div>
    </div>
  );
}
