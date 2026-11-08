import { useState, type FormEvent } from "react";
import { FormField } from "../../../components/ui/FormField";
import { StatusMessage } from "../../admin/components/ui/StatusMessage";
import { useSave } from "../../admin/components/forms/useSave";
import { useAuth } from "../../auth/context/useAuth";
import { updateProfile } from "../api/accountApi";

export function ProfileForm() {
  const { user, replaceUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const save = useSave();

  async function submit(event: FormEvent) {
    event.preventDefault();
    await save.run(async () => {
      replaceUser(await updateProfile(displayName));
    }, "Name updated.");
  }

  return (
    <form onSubmit={submit} className="form">
      <FormField
        label="Display name"
        name="displayName"
        autoComplete="nickname"
        required
        minLength={2}
        maxLength={64}
        value={displayName}
        error={save.fieldErrors.displayName}
        onChange={(event) => setDisplayName(event.target.value)}
      />
      <StatusMessage error={save.error} />
      <button type="submit" className="button" disabled={save.saving}>
        Save name
      </button>
    </form>
  );
}
