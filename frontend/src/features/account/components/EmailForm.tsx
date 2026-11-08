import { useState, type FormEvent } from "react";
import { FormField } from "../../../components/ui/FormField";
import { StatusMessage } from "../../admin/components/StatusMessage";
import { useSave } from "../../admin/components/useSave";
import { requestEmailChange } from "../api/accountApi";

export function EmailForm({ currentEmail }: { currentEmail: string }) {
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const save = useSave();

  async function submit(event: FormEvent) {
    event.preventDefault();
    const saved = await save.run(
      () => requestEmailChange(newEmail, currentPassword),
      `We sent a confirmation link to ${newEmail}. Your email changes after you open it.`,
    );
    if (saved) {
      setNewEmail("");
      setCurrentPassword("");
    }
  }

  return (
    <form onSubmit={submit} className="form">
      <p>
        Current email: <strong>{currentEmail}</strong>
      </p>
      <FormField
        label="New email"
        name="newEmail"
        type="email"
        autoComplete="email"
        required
        value={newEmail}
        error={save.fieldErrors.newEmail}
        onChange={(event) => setNewEmail(event.target.value)}
      />
      <FormField
        label="Current password"
        name="emailPassword"
        type="password"
        autoComplete="current-password"
        required
        value={currentPassword}
        onChange={(event) => setCurrentPassword(event.target.value)}
      />
      <StatusMessage error={save.error} />
      <button type="submit" className="button" disabled={save.saving}>
        Send confirmation
      </button>
    </form>
  );
}
