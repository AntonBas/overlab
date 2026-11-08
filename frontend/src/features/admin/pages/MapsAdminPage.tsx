import { useState, type FormEvent } from "react";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Spinner } from "../../../components/ui/Spinner";
import { Thumbnail } from "../../../components/ui/Thumbnail";
import { matchesName } from "../../../utils/search";
import { useFetch } from "../../../hooks/useFetch";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { MAP_MODE_LABELS } from "../../../utils/format";
import type { GameMap, MapMode } from "../../../types/api";
import {
  fetchAdminMaps,
  removeMapImage,
  updateMap,
  uploadMapImage,
} from "../api/adminApi";
import { DataTable } from "../components/DataTable";
import { Drawer } from "../components/Drawer";
import { SelectField } from "../components/Fields";
import { ImageUploadField } from "../components/ImageUploadField";
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
  const save = useSave();
  useUnsavedChanges(mode !== (map.mode ?? ""));

  async function submit(event: FormEvent) {
    event.preventDefault();
    const saved = await save.run(
      () =>
        updateMap(map.slug, {
          mode: mode === "" ? null : (mode as MapMode),
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
            {MAP_MODE_LABELS[value]}
          </option>
        ))}
      </SelectField>
      <ImageUploadField
        label="Image"
        imageUrl={map.imageUrl}
        onUpload={async (file) => {
          await uploadMapImage(map.slug, file);
          onSaved();
        }}
        onRemove={async () => {
          await removeMapImage(map.slug);
          onSaved();
        }}
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

export function MapsAdminPage() {
  usePageTitle("Admin: maps");
  const maps = useFetch(fetchAdminMaps, []);
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
          searchLabel="Search maps"
          matches={(map, query) => matchesName(map.name, query)}
          columns={[
            {
              header: "Name",
              render: (map) => (
                <span className="admin__name">
                  <Thumbnail url={map.imageUrl} width={48} height={27} />
                  {map.name}
                </span>
              ),
            },
            {
              header: "Mode",
              render: (map) =>
                map.mode ? MAP_MODE_LABELS[map.mode] : "Unknown",
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
        <Drawer label="Edit map" onClose={() => setEditing(null)}>
          <MapForm
            key={selected.slug}
            map={selected}
            onSaved={maps.reload}
            onClose={() => setEditing(null)}
          />
        </Drawer>
      )}
    </>
  );
}
