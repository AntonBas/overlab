import { useState, type FormEvent } from "react";
import { FormField } from "../../../components/ui/FormField";
import { StatusMessage } from "../../admin";
import { useSave } from "../../admin";
import { useAuth } from "../../auth";
import { changePassword } from "../api/accountApi";

export function PasswordForm() {
  const { replaceUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const save = useSave();

  async function submit(event: FormEvent) {
    event.preventDefault();
    const saved = await save.run(async () => {
      replaceUser(await changePassword(currentPassword, newPassword));
    }, "Password changed.");
    if (saved) {
      setCurrentPassword("");
      setNewPassword("");
    }
  }

  return (
    <form onSubmit={submit} className="form">
      <FormField
        label="Current password"
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        required
        value={currentPassword}
        onChange={(event) => setCurrentPassword(event.target.value)}
      />
      <FormField
        label="New password"
        name="newPassword"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        maxLength={72}
        hint="8 to 72 characters"
        value={newPassword}
        error={save.fieldErrors.newPassword}
        onChange={(event) => setNewPassword(event.target.value)}
      />
      <StatusMessage error={save.error} />
      <button type="submit" className="button" disabled={save.saving}>
        Change password
      </button>
    </form>
  );
}
