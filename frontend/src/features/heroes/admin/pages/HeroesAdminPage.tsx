import { useState, type FormEvent } from "react";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { HeroPortrait } from "../../../../components/ui/HeroPortrait";
import { PageHeader } from "../../../../components/ui/PageHeader";
import { Spinner } from "../../../../components/ui/Spinner";
import { matchesName } from "../../../../utils/search";
import { useFetch } from "../../../../hooks/useFetch";
import { usePageTitle } from "../../../../hooks/usePageTitle";
import { ROLE_LABELS } from "../../../../utils/format";
import { fetchAdminHeroes, updateHero } from "../api/heroesAdminApi";
import { DataTable } from "../../../../components/admin/DataTable";
import { Drawer } from "../../../../components/admin/Drawer";
import {
  CheckboxField,
  TextAreaField,
} from "../../../../components/admin/Fields";
import { StatusMessage } from "../../../../components/admin/StatusMessage";
import { useAdminForm } from "../../../../components/admin/useAdminForm";
import { StatusBadge } from "../../../../components/admin/StatusBadge";
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
  const { values, change, save } = useAdminForm({
    description: hero.description ?? "",
    strengths: hero.strengths ?? "",
    weaknesses: hero.weaknesses ?? "",
    active: hero.active,
  });
  const { description, strengths, weaknesses, active } = values;

  async function submit(event: FormEvent) {
    event.preventDefault();
    const saved = await save.run(
      () =>
        updateHero(hero.slug, {
          description: description.trim() === "" ? null : description,
          strengths: strengths.trim() === "" ? null : strengths,
          weaknesses: weaknesses.trim() === "" ? null : weaknesses,
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
        onChange={(event) => change("description", event.target.value)}
      />
      <TextAreaField
        label="Strengths"
        name="strengths"
        hint="One point per line."
        value={strengths}
        error={save.fieldErrors.strengths}
        onChange={(event) => change("strengths", event.target.value)}
      />
      <TextAreaField
        label="Weaknesses"
        name="weaknesses"
        hint="One point per line."
        value={weaknesses}
        error={save.fieldErrors.weaknesses}
        onChange={(event) => change("weaknesses", event.target.value)}
      />
      <CheckboxField
        label="Active"
        name="active"
        hint="Inactive heroes are hidden from the public site."
        checked={active}
        onChange={(event) => change("active", event.target.checked)}
      />
      <StatusMessage error={save.error} />
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
      {heroes.loading && <Spinner label="Loading heroes" />}
      {heroes.error && (
        <ErrorMessage failure={heroes.error} onRetry={heroes.reload} />
      )}
      {heroes.data && (
        <DataTable
          rows={heroes.data}
          rowKey={(hero) => hero.slug}
          pageSize={15}
          searchLabel="Search heroes"
          matches={(hero, query) => matchesName(hero.name, query)}
          columns={[
            {
              header: "Name",
              render: (hero) => (
                <span className="admin__name">
                  <HeroPortrait name={hero.name} url={hero.portraitUrl} />
                  {hero.name}
                </span>
              ),
            },
            { header: "Role", render: (hero) => ROLE_LABELS[hero.role] },
            {
              header: "Status",
              render: (hero) => (
                <StatusBadge
                  value={hero.active ? "Active" : "Inactive"}
                  tone={hero.active ? "good" : "neutral"}
                />
              ),
            },
            {
              header: "",
              render: (hero) => (
                <button
                  type="button"
                  className="button button--ghost"
                  aria-label={`Edit ${hero.name}`}
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
