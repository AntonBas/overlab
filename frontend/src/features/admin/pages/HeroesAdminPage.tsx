import { useState, type FormEvent } from "react";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Spinner } from "../../../components/ui/Spinner";
import { useFetch } from "../../../hooks/useFetch";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { fetchAdminHeroes, updateHero } from "../api/adminApi";
import { DataTable } from "../components/DataTable";
import { Drawer } from "../components/Drawer";
import { CheckboxField, TextAreaField } from "../components/Fields";
import { StatusMessage } from "../components/StatusMessage";
import { useSave } from "../components/useSave";
import { useUnsavedChanges } from "../components/unsavedChanges";
import type { AdminHero } from "../types";

function HeroForm({
  hero,
  onSaved,
  onClose,
}: {
  hero: AdminHero;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [description, setDescription] = useState(hero.description ?? "");
  const [active, setActive] = useState(hero.active);
  const save = useSave();
  const dirty =
    description !== (hero.description ?? "") || active !== hero.active;
  useUnsavedChanges(dirty);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const saved = await save.run(
      () =>
        updateHero(hero.slug, {
          description: description.trim() === "" ? null : description,
          active,
        }),
      "Hero saved.",
    );
    if (saved) {
      onSaved();
    }
  }

  return (
    <form className="form admin__form" onSubmit={submit}>
      <h2>Edit {hero.name}</h2>
      <TextAreaField
        label="Description"
        name="description"
        value={description}
        error={save.fieldErrors.description}
        onChange={(event) => setDescription(event.target.value)}
      />
      <CheckboxField
        label="Active"
        name="active"
        hint="Inactive heroes are hidden from the public site."
        checked={active}
        onChange={(event) => setActive(event.target.checked)}
      />
      <StatusMessage error={save.error} success={save.success} />
      <div className="form__actions">
        <button type="submit" className="button" disabled={save.saving}>
          Save
        </button>
        <button
          type="button"
          className="button button--ghost"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </form>
  );
}

export function HeroesAdminPage() {
  usePageTitle("Admin: heroes");
  const heroes = useFetch(fetchAdminHeroes, []);
  const [editing, setEditing] = useState<string | null>(null);
  const selected = heroes.data?.find((hero) => hero.slug === editing) ?? null;

  return (
    <>
      <PageHeader title="Heroes" />
      {heroes.loading && <Spinner />}
      {heroes.error && (
        <ErrorMessage failure={heroes.error} onRetry={heroes.reload} />
      )}
      {heroes.data && (
        <DataTable
          rows={heroes.data}
          rowKey={(hero) => hero.slug}
          pageSize={30}
          columns={[
            { header: "Name", render: (hero) => hero.name },
            { header: "Role", render: (hero) => hero.role },
            {
              header: "Status",
              render: (hero) => (hero.active ? "Active" : "Inactive"),
            },
            {
              header: "",
              render: (hero) => (
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() => setEditing(hero.slug)}
                >
                  Edit
                </button>
              ),
            },
          ]}
        />
      )}
      {selected && (
        <Drawer label="Edit hero" onClose={() => setEditing(null)}>
          <HeroForm
            key={selected.slug}
            hero={selected}
            onSaved={heroes.reload}
            onClose={() => setEditing(null)}
          />
        </Drawer>
      )}
    </>
  );
}
