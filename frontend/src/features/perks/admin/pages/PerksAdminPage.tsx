import { Plus } from "lucide-react";
import { RowAction, RowActions } from "../../../../components/admin/RowActions";
import { useState, type FormEvent } from "react";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { PageHeader } from "../../../../components/ui/PageHeader";
import { Spinner } from "../../../../components/ui/Spinner";
import { Thumbnail } from "../../../../components/ui/Thumbnail";
import { useFetch } from "../../../../hooks/useFetch";
import { usePageTitle } from "../../../../hooks/usePageTitle";
import { humanize } from "../../../../utils/format";
import type {
  Perk,
  PerkPosition,
  PerkRecommendation,
  PerkSlot,
} from "../../../../types/hero";
import {
  createPerk,
  deletePerk,
  fetchPerks,
  importPerks,
  removePerkIcon,
  updatePerk,
  uploadPerkIcon,
} from "../api/perksAdminApi";
import { ConfirmDialog } from "../../../../components/admin/ConfirmDialog";
import { DataTable } from "../../../../components/admin/DataTable";
import { Drawer } from "../../../../components/admin/Drawer";
import {
  SelectField,
  TextAreaField,
} from "../../../../components/admin/Fields";
import { HeroSelect } from "../../../heroes/admin";
import { ImageUploadField } from "../../../../components/admin/ImageUploadField";
import { StatusMessage } from "../../../../components/admin/StatusMessage";
import { useHeroOptions } from "../../../heroes/admin";
import { useAdminForm } from "../../../../components/admin/useAdminForm";
import { useSave } from "../../../../components/admin/useSave";
import { FormField } from "../../../../components/ui/FormField";

const RECOMMENDATIONS: PerkRecommendation[] = [
  "RECOMMENDED",
  "OPTIONAL",
  "AVOID",
];

interface PerkFormProps {
  heroSlug: string;
  perk: Perk | null;
  onSaved: () => void;
  onClose: () => void;
}

function PerkForm({ heroSlug, perk, onSaved, onClose }: PerkFormProps) {
  const { values, change, save } = useAdminForm({
    name: perk?.name ?? "",
    description: perk?.description ?? "",
    slot: perk?.slot ?? "MINOR",
    position: perk?.position ?? "LEFT",
    recommendation: perk?.recommendation ?? "OPTIONAL",
    note: perk?.recommendationNote ?? "",
  });
  const { name, description, slot, position, recommendation, note } = values;

  async function submit(event: FormEvent) {
    event.preventDefault();
    const payload = {
      heroSlug,
      name: name.trim(),
      description: description.trim() === "" ? null : description,
      slot,
      position,
      recommendation,
      recommendationNote: note.trim() === "" ? null : note,
    };
    const saved = await save.run(
      () => (perk ? updatePerk(perk.id, payload) : createPerk(payload)),
      "Perk saved.",
    );
    if (saved) {
      onSaved();
      onClose();
    }
  }

  return (
    <form className="form admin__form" onSubmit={submit}>
      <h2>{perk ? `Edit ${perk.name}` : "New perk"}</h2>
      <FormField
        label="Name"
        name="name"
        required
        value={name}
        error={save.fieldErrors.name}
        onChange={(event) => change("name", event.target.value)}
      />
      <TextAreaField
        label="Description"
        name="description"
        value={description}
        error={save.fieldErrors.description}
        onChange={(event) => change("description", event.target.value)}
      />
      <SelectField
        label="Slot"
        name="slot"
        value={slot}
        onChange={(event) => change("slot", event.target.value as PerkSlot)}
      >
        <option value="MINOR">Minor</option>
        <option value="MAJOR">Major</option>
      </SelectField>
      <SelectField
        label="Position"
        name="position"
        value={position}
        error={save.fieldErrors.position}
        onChange={(event) =>
          change("position", event.target.value as PerkPosition)
        }
      >
        <option value="LEFT">Left</option>
        <option value="RIGHT">Right</option>
      </SelectField>
      <SelectField
        label="Recommendation"
        name="recommendation"
        value={recommendation}
        onChange={(event) =>
          change("recommendation", event.target.value as PerkRecommendation)
        }
      >
        {RECOMMENDATIONS.map((value) => (
          <option key={value} value={value}>
            {humanize(value)}
          </option>
        ))}
      </SelectField>
      <TextAreaField
        label="Recommendation note"
        name="recommendationNote"
        rows={2}
        value={note}
        error={save.fieldErrors.recommendationNote}
        onChange={(event) => change("note", event.target.value)}
      />
      {perk ? (
        <ImageUploadField
          label="Icon"
          imageUrl={perk.iconUrl}
          onUpload={async (file) => {
            await uploadPerkIcon(perk.id, file);
            onSaved();
          }}
          onRemove={async () => {
            await removePerkIcon(perk.id);
            onSaved();
          }}
        />
      ) : (
        <p className="muted">Save the perk first, then add an icon.</p>
      )}
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
          Cancel
        </button>
      </div>
    </form>
  );
}

export function PerksAdminPage() {
  usePageTitle("Admin: perks");
  const heroes = useHeroOptions();
  const [heroSlug, setHeroSlug] = useState("");
  const perks = useFetch(
    () => (heroSlug ? fetchPerks(heroSlug) : Promise.resolve([] as Perk[])),
    [heroSlug],
  );
  const [editing, setEditing] = useState<Perk | "new" | null>(null);
  const [deleting, setDeleting] = useState<Perk | null>(null);
  const removal = useSave();
  const importing = useSave();

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    const removed = await removal.run(
      () => deletePerk(deleting.id),
      `Perk ${deleting.name} deleted.`,
    );
    if (removed) {
      perks.reload();
    }
    setDeleting(null);
  }

  return (
    <>
      <PageHeader
        title="Perks"
        actions={
          <button
            type="button"
            className="button button--ghost"
            disabled={importing.saving}
            onClick={() =>
              importing.run(
                importPerks,
                "Import started. It takes a few minutes; reload the list afterwards.",
              )
            }
          >
            Import from Blizzard
          </button>
        }
      />
      <StatusMessage error={importing.error} />
      {heroes.error && (
        <ErrorMessage failure={heroes.error} onRetry={heroes.reload} />
      )}
      <div className="table-search">
        {heroes.data && (
          <HeroSelect
            label="Hero"
            value={heroSlug}
            heroes={heroes.data}
            placeholder="Choose a hero"
            onChange={(slug) => {
              setHeroSlug(slug);
              setEditing(null);
              removal.reset();
            }}
          />
        )}
        {heroSlug && (
          <div className="table-search__action">
            <button
              type="button"
              className="button"
              onClick={() => setEditing("new")}
            >
              <Plus size={16} aria-hidden="true" />
              New perk
            </button>
          </div>
        )}
      </div>
      <StatusMessage error={removal.error} />
      {heroSlug && perks.loading && <Spinner label="Loading perks" />}
      {perks.error && (
        <ErrorMessage failure={perks.error} onRetry={perks.reload} />
      )}
      {heroSlug && perks.data && (
        <DataTable
          rows={perks.data}
          rowKey={(perk) => perk.id}
          emptyMessage="This hero has no perks yet."
          columns={[
            {
              header: "Name",
              render: (perk) => (
                <span className="admin__name">
                  <Thumbnail
                    url={perk.iconUrl}
                    width={40}
                    height={40}
                    className="thumbnail--icon"
                  />
                  {perk.name}
                </span>
              ),
            },
            { header: "Slot", render: (perk) => humanize(perk.slot) },
            { header: "Position", render: (perk) => humanize(perk.position) },
            {
              header: "Recommendation",
              render: (perk) => humanize(perk.recommendation),
            },
            {
              header: "",
              render: (perk) => (
                <RowActions>
                  <RowAction
                    kind="edit"
                    label="Edit"
                    onClick={() => setEditing(perk)}
                  />
                  <RowAction
                    kind="delete"
                    label="Delete"
                    onClick={() => setDeleting(perk)}
                  />
                </RowActions>
              ),
            },
          ]}
        />
      )}
      {heroSlug && editing && (
        <Drawer label="Perk" onClose={() => setEditing(null)}>
          <PerkForm
            key={editing === "new" ? "new" : editing.id}
            heroSlug={heroSlug}
            perk={
              editing === "new"
                ? null
                : (perks.data?.find((perk) => perk.id === editing.id) ??
                  editing)
            }
            onSaved={perks.reload}
            onClose={() => setEditing(null)}
          />
        </Drawer>
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete perk"
          message={`Delete the perk "${deleting.name}"? This cannot be undone.`}
          busy={removal.saving}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  );
}
