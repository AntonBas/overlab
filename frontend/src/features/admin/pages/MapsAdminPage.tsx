import { useState, type FormEvent } from "react";
import { FormField } from "../../../components/ui/FormField";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Spinner } from "../../../components/ui/Spinner";
import { useFetch } from "../../../hooks/useFetch";
import { usePageTitle } from "../../../hooks/usePageTitle";
import type { GameMap, MapMode } from "../../../types/api";
import { fetchMaps } from "../../maps/api/mapsApi";
import { updateMap } from "../api/adminApi";
import { DataTable } from "../components/DataTable";
import { SelectField } from "../components/Fields";
import { StatusMessage } from "../components/StatusMessage";
import { useSave } from "../components/useSave";
import { useUnsavedChanges } from "../components/unsavedChanges";

const MODES: MapMode[] = [
  "CONTROL",
  "ESCORT",
  "HYBRID",
  "PUSH",
  "FLASHPOINT",
  "CLASH",
];

function MapForm({
  map,
  onSaved,
  onClose,
}: {
  map: GameMap;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<string>(map.mode ?? "");
  const [imageUrl, setImageUrl] = useState(map.imageUrl ?? "");
  const save = useSave();
  useUnsavedChanges(
    mode !== (map.mode ?? "") || imageUrl !== (map.imageUrl ?? ""),
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    const saved = await save.run(
      () =>
        updateMap(map.slug, {
          mode: mode === "" ? null : (mode as MapMode),
          imageUrl: imageUrl.trim() === "" ? null : imageUrl.trim(),
        }),
      "Map saved.",
    );
    if (saved) {
      onSaved();
    }
  }

  return (
    <form className="form admin__form" onSubmit={submit}>
      <h2>Edit {map.name}</h2>
      <SelectField
        label="Mode"
        name="mode"
        value={mode}
        error={save.fieldErrors.mode}
        onChange={(event) => setMode(event.target.value)}
      >
        <option value="">Unknown</option>
        {MODES.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </SelectField>
      <FormField
        label="Image URL"
        name="imageUrl"
        type="url"
        value={imageUrl}
        error={save.fieldErrors.imageUrl}
        onChange={(event) => setImageUrl(event.target.value)}
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

export function MapsAdminPage() {
  usePageTitle("Admin: maps");
  const maps = useFetch(fetchMaps, []);
  const [editing, setEditing] = useState<string | null>(null);
  const selected = maps.data?.find((map) => map.slug === editing) ?? null;

  return (
    <>
      <PageHeader title="Maps" />
      {maps.loading && <Spinner />}
      {maps.error && (
        <ErrorMessage failure={maps.error} onRetry={maps.reload} />
      )}
      {maps.data && (
        <DataTable
          rows={maps.data}
          rowKey={(map) => map.slug}
          pageSize={30}
          columns={[
            { header: "Name", render: (map) => map.name },
            { header: "Mode", render: (map) => map.mode ?? "Unknown" },
            {
              header: "Image",
              render: (map) => (map.imageUrl ? "Set" : "None"),
            },
            {
              header: "",
              render: (map) => (
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() => setEditing(map.slug)}
                >
                  Edit
                </button>
              ),
            },
          ]}
        />
      )}
      {selected && (
        <MapForm
          key={selected.slug}
          map={selected}
          onSaved={maps.reload}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
