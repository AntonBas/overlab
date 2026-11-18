import { Plus } from "lucide-react";
import { RowAction, RowActions } from "../../../../components/admin/RowActions";
import { useState, type FormEvent } from "react";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { PageHeader } from "../../../../components/ui/PageHeader";
import { Spinner } from "../../../../components/ui/Spinner";
import { useFetch } from "../../../../hooks/useFetch";
import { usePageTitle } from "../../../../hooks/usePageTitle";
import { humanize } from "../../../../utils/format";
import {
  createRelation,
  deleteRelation,
  fetchRelations,
  updateRelation,
} from "../api/relationsAdminApi";
import { ConfirmDialog } from "../../../../components/admin/ConfirmDialog";
import { DataTable } from "../../../../components/admin/DataTable";
import { Drawer } from "../../../../components/admin/Drawer";
import {
  SelectField,
  TextAreaField,
} from "../../../../components/admin/Fields";
import { HeroLabel } from "../../../heroes/admin";
import { HeroSelect } from "../../../heroes/admin";
import { StatusMessage } from "../../../../components/admin/StatusMessage";
import { useHeroOptions } from "../../../heroes/admin";
import { useAdminForm } from "../../../../components/admin/useAdminForm";
import { useSave } from "../../../../components/admin/useSave";
import type { AdminHero } from "../../../heroes/admin";
import type { HeroRelation, RelationType } from "../types";
import { describeRelationConflict } from "../utils/relations";

interface RelationFormProps {
  relation: HeroRelation | null;
  heroes: AdminHero[];
  existing: HeroRelation[];
  defaultHero: string;
  onSaved: () => void;
  onClose: () => void;
}

function RelationForm({
  relation,
  heroes,
  existing,
  defaultHero,
  onSaved,
  onClose,
}: RelationFormProps) {
  const { values, change, save } = useAdminForm({
    heroSlug: relation?.heroSlug ?? defaultHero,
    relatedHeroSlug: relation?.relatedHeroSlug ?? "",
    type: relation?.type ?? "COUNTER",
    note: relation?.note ?? "",
  });
  const { heroSlug, relatedHeroSlug, type, note } = values;
  const conflict = describeRelationConflict(
    { heroSlug, relatedHeroSlug, type },
    existing,
    relation?.id ?? null,
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    const payload = {
      heroSlug,
      relatedHeroSlug,
      type,
      note: note.trim() === "" ? null : note,
    };
    const saved = await save.run(
      () =>
        relation
          ? updateRelation(relation.id, payload)
          : createRelation(payload),
      "Relation saved.",
    );
    if (saved) {
      onSaved();
      onClose();
    }
  }

  return (
    <form className="form admin__form" onSubmit={submit}>
      <h2>{relation ? "Edit relation" : "New relation"}</h2>
      <SelectField
        label="Type"
        name="type"
        value={type}
        onChange={(event) => change("type", event.target.value as RelationType)}
      >
        <option value="COUNTER">
          Counter (the hero is strong against the related hero)
        </option>
        <option value="SYNERGY">Synergy</option>
      </SelectField>
      <HeroSelect
        label="Hero"
        value={heroSlug}
        heroes={heroes}
        placeholder="Choose a hero"
        error={save.fieldErrors.heroSlug}
        onChange={(value) => change("heroSlug", value)}
      />
      <HeroSelect
        label="Related hero"
        value={relatedHeroSlug}
        heroes={heroes}
        placeholder="Choose a hero"
        error={save.fieldErrors.relatedHeroSlug}
        onChange={(value) => change("relatedHeroSlug", value)}
      />
      <TextAreaField
        label="Note"
        name="note"
        rows={2}
        value={note}
        error={save.fieldErrors.note}
        onChange={(event) => change("note", event.target.value)}
      />
      {conflict && <p className="notice notice--error">{conflict}</p>}
      <StatusMessage error={save.error} />
      <div className="form__actions">
        <button
          type="submit"
          className="button"
          disabled={
            save.saving || conflict !== null || !heroSlug || !relatedHeroSlug
          }
        >
          Save
        </button>
        <button
          type="button"
          className="button button--ghost"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function RelationsAdminPage() {
  usePageTitle("Admin: counters and synergies");
  const heroes = useHeroOptions();
  const [filter, setFilter] = useState("");
  const everything = useFetch(() => fetchRelations(), []);
  const filtered = useFetch(
    () => (filter ? fetchRelations(filter) : Promise.resolve(null)),
    [filter],
  );
  const relations = filter ? filtered : everything;
  const [editing, setEditing] = useState<HeroRelation | "new" | null>(null);
  const [deleting, setDeleting] = useState<HeroRelation | null>(null);
  const removal = useSave();
  const names = new Map(heroes.data?.map((hero) => [hero.slug, hero.name]));
  const label = (slug: string) => names.get(slug) ?? slug;

  function reload() {
    filtered.reload();
    everything.reload();
  }

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    const removed = await removal.run(
      () => deleteRelation(deleting.id),
      "Relation deleted.",
    );
    if (removed) {
      reload();
    }
    setDeleting(null);
  }

  return (
    <>
      <PageHeader title="Counters and synergies" />
      <div className="table-search">
        {heroes.data && (
          <HeroSelect
            label="Filter by hero"
            value={filter}
            heroes={heroes.data}
            allLabel="All heroes"
            onChange={setFilter}
          />
        )}
        <div className="table-search__action">
          <button
            type="button"
            className="button"
            onClick={() => setEditing("new")}
          >
            <Plus size={16} aria-hidden="true" />
            New relation
          </button>
        </div>
      </div>
      <StatusMessage error={removal.error} />
      {relations.loading && <Spinner label="Loading relations" />}
      {relations.error && (
        <ErrorMessage failure={relations.error} onRetry={relations.reload} />
      )}
      {relations.data && (
        <DataTable
          rows={relations.data}
          rowKey={(relation) => relation.id}
          emptyMessage="No relations yet."
          columns={[
            { header: "Type", render: (relation) => humanize(relation.type) },
            {
              header: "Hero",
              render: (relation) =>
                heroes.data ? (
                  <HeroLabel slug={relation.heroSlug} heroes={heroes.data} />
                ) : (
                  relation.heroSlug
                ),
            },
            {
              header: "Related hero",
              render: (relation) =>
                heroes.data ? (
                  <HeroLabel
                    slug={relation.relatedHeroSlug}
                    heroes={heroes.data}
                  />
                ) : (
                  relation.relatedHeroSlug
                ),
            },
            {
              header: "",
              render: (relation) => (
                <RowActions>
                  <RowAction
                    kind="edit"
                    label="Edit"
                    onClick={() => setEditing(relation)}
                  />
                  <RowAction
                    kind="delete"
                    label="Delete"
                    onClick={() => setDeleting(relation)}
                  />
                </RowActions>
              ),
            },
          ]}
        />
      )}
      {editing && heroes.data && (
        <Drawer label="Hero relation" onClose={() => setEditing(null)}>
          <RelationForm
            key={editing === "new" ? "new" : editing.id}
            relation={editing === "new" ? null : editing}
            heroes={heroes.data}
            existing={everything.data ?? []}
            defaultHero={filter}
            onSaved={reload}
            onClose={() => setEditing(null)}
          />
        </Drawer>
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete relation"
          message={`Delete the ${deleting.type.toLowerCase()} between ${label(deleting.heroSlug)} and ${label(deleting.relatedHeroSlug)}?`}
          busy={removal.saving}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  );
}
