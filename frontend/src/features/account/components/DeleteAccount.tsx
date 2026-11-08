import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FormField } from "../../../components/ui/FormField";
import { StatusMessage } from "../../admin/components/ui/StatusMessage";
import { useSave } from "../../admin/components/forms/useSave";
import { useAuth } from "../../auth/context/useAuth";
import { deleteAccount } from "../api/accountApi";

export function DeleteAccount() {
  const { user, replaceUser } = useAuth();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const save = useSave();
  const needsPassword = user?.provider === "LOCAL";

  async function confirm() {
    const deleted = await save.run(
      () => deleteAccount(needsPassword ? password : null),
      "Account deleted.",
    );
    if (deleted) {
      replaceUser(null);
      navigate("/stats", { replace: true });
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
      <StatusMessage error={save.error} />
      <div className="dialog__actions">
        <button
          type="button"
          className="button button--ghost"
          onClick={() => setConfirming(false)}
        >
          Cancel
        </button>
        <button
          type="button"
          className="button button--danger"
          disabled={save.saving || (needsPassword && password === "")}
          onClick={() => void confirm()}
        >
          Delete permanently
        </button>
      </div>
    </div>
  );
}
