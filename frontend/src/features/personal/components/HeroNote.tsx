import { useState, type FormEvent } from "react";
import { useFetch } from "../../../hooks/useFetch";
import { StatusMessage } from "../../admin/components/StatusMessage";
import { TextAreaField } from "../../admin/components/Fields";
import { useSave } from "../../admin/components/useSave";
import { useAuth } from "../../auth/context/useAuth";
import { fetchNote, saveNote } from "../api/personalApi";

const MAX_LENGTH = 2000;

export function HeroNote({ heroSlug }: { heroSlug: string }) {
  const { user } = useAuth();
  const note = useFetch(
    () => (user ? fetchNote(heroSlug) : Promise.resolve(null)),
    [heroSlug, user?.id],
  );
  const [draft, setDraft] = useState<string | null>(null);
  const save = useSave();
  const content = draft ?? note.data?.content ?? "";

  if (!user) {
    return null;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    await save.run(
      async () => {
        await saveNote(heroSlug, content);
      },
      content.trim() === "" ? "Note removed." : "Note saved.",
    );
  }

  return (
    <section className="section">
      <h2>Your private note</h2>
      <form onSubmit={submit} className="form">
        <TextAreaField
          label="Note"
          name="heroNote"
          maxLength={MAX_LENGTH}
          hint={`Only you can see this. ${content.length} of ${MAX_LENGTH} characters.`}
          value={content}
          onChange={(event) => setDraft(event.target.value)}
        />
        <StatusMessage error={save.error} success={save.success} />
        <button type="submit" className="button" disabled={save.saving}>
          Save note
        </button>
      </form>
    </section>
  );
}
