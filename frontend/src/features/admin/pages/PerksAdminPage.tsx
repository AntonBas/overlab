import { useState, type FormEvent } from "react";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Spinner } from "../../../components/ui/Spinner";
import { Thumbnail } from "../../../components/ui/Thumbnail";
import { HeroPortrait } from "../../../components/ui/HeroPortrait";
import { useFetch } from "../../../hooks/useFetch";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { humanize } from "../../../utils/format";
import type {
  Perk,
  PerkPosition,
  PerkRecommendation,
  PerkSlot,
} from "../../../types/api";
import {
  createPerk,
  deletePerk,
  fetchPerks,
  importPerks,
  removePerkIcon,
  updatePerk,
  uploadPerkIcon,
} from "../api/adminApi";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { DataTable } from "../components/DataTable";
import { Drawer } from "../components/Drawer";
import { SelectField, TextAreaField } from "../components/Fields";
import { ImageUploadField } from "../components/ImageUploadField";
import { StatusMessage } from "../components/StatusMessage";
import { useHeroOptions } from "../components/useHeroOptions";
import { useSave } from "../components/useSave";
import { useUnsavedChanges } from "../components/unsavedChanges";
import { FormField } from "../../../components/ui/FormField";

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
  const [name, setName] = useState(perk?.name ?? "");
  const [description, setDescription] = useState(perk?.description ?? "");
  const [slot, setSlot] = useState<PerkSlot>(perk?.slot ?? "MINOR");
  const [position, setPosition] = useState<PerkPosition>(
    perk?.position ?? "LEFT",
  );
  const [recommendation, setRecommendation] = useState<PerkRecommendation>(
    perk?.recommendation ?? "OPTIONAL",
  );
  const [note, setNote] = useState(perk?.recommendationNote ?? "");
  const save = useSave();
  const dirty =
    name !== (perk?.name ?? "") ||
    description !== (perk?.description ?? "") ||
    slot !== (perk?.slot ?? "MINOR") ||
    position !== (perk?.position ?? "LEFT") ||
    recommendation !== (perk?.recommendation ?? "OPTIONAL") ||
    note !== (perk?.recommendationNote ?? "");
  useUnsavedChanges(dirty && !save.success);

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
        onChange={(event) => setName(event.target.value)}
      />
      <TextAreaField
        label="Description"
        name="description"
        value={description}
        error={save.fieldErrors.description}
        onChange={(event) => setDescription(event.target.value)}
      />
      <SelectField
        label="Slot"
        name="slot"
        value={slot}
        onChange={(event) => setSlot(event.target.value as PerkSlot)}
      >
        <option value="MINOR">Minor</option>
        <option value="MAJOR">Major</option>
      </SelectField>
      <SelectField
        label="Position"
        name="position"
        value={position}
        error={save.fieldErrors.position}
        onChange={(event) => setPosition(event.target.value as PerkPosition)}
      >
        <option value="LEFT">Left</option>
        <option value="RIGHT">Right</option>
      </SelectField>
      <SelectField
        label="Recommendation"
        name="recommendation"
        value={recommendation}
        onChange={(event) =>
          setRecommendation(event.target.value as PerkRecommendation)
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
        onChange={(event) => setNote(event.target.value)}
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
  const selectedHero = heroes.data?.find((hero) => hero.slug === heroSlug);
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
          <>
            <button
              type="button"
              className="button button--ghost"
              disabled={importing.saving}
              onClick={() =>
                importing.run(
                  importPerks,
                  "Import started. It takes a few minutes, reload the list afterwards.",
                )
              }
            >
              Import from Blizzard
            </button>
            {heroSlug && (
              <button
                type="button"
                className="button"
                onClick={() => setEditing("new")}
              >
                New perk
              </button>
            )}
          </>
        }
      />
      <StatusMessage error={importing.error} success={importing.success} />
      {heroes.error && (
        <ErrorMessage failure={heroes.error} onRetry={heroes.reload} />
      )}
      <div className="admin__picker">
        <SelectField
          label="Hero"
          name="hero"
          value={heroSlug}
          onChange={(event) => {
            setHeroSlug(event.target.value);
            setEditing(null);
            removal.reset();
          }}
        >
          <option value="">Choose a hero</option>
          {heroes.data?.map((hero) => (
            <option key={hero.slug} value={hero.slug}>
              {hero.name}
            </option>
          ))}
        </SelectField>
        {selectedHero && (
          <HeroPortrait
            name={selectedHero.name}
            url={selectedHero.portraitUrl}
            size={44}
          />
        )}
      </div>
      <StatusMessage error={removal.error} success={removal.success} />
      {heroSlug && perks.loading && <Spinner />}
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
              header: "Icon",
              render: (perk) => (perk.iconUrl ? "Set" : "None"),
            },
            {
              header: "Recommendation",
              render: (perk) => humanize(perk.recommendation),
            },
            {
              header: "",
              render: (perk) => (
                <div className="form__actions">
                  <button
                    type="button"
                    className="button button--ghost"
                    onClick={() => setEditing(perk)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="button button--ghost"
                    onClick={() => setDeleting(perk)}
                  >
                    Delete
                  </button>
                </div>
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
