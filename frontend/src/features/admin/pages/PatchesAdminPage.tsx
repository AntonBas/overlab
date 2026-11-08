import { useState, type FormEvent } from "react";
import { FormField } from "../../../components/ui/FormField";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Spinner } from "../../../components/ui/Spinner";
import { useFetch } from "../../../hooks/useFetch";
import { usePageTitle } from "../../../hooks/usePageTitle";
import type { Patch } from "../../../types/api";
import {
  createPatch,
  deletePatch,
  fetchPatches,
  importPatches,
  updatePatch,
} from "../api/adminApi";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { DataTable } from "../components/DataTable";
import { Drawer } from "../components/Drawer";
import { TextAreaField } from "../components/Fields";
import { StatusMessage } from "../components/StatusMessage";
import { useSave } from "../components/useSave";
import { useUnsavedChanges } from "../components/unsavedChanges";
import { formatDateTime } from "../../../utils/format";

function toLocalInput(iso: string): string {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

interface PatchFormProps {
  patch: Patch | null;
  onSaved: () => void;
  onClose: () => void;
}

function PatchForm({ patch, onSaved, onClose }: PatchFormProps) {
  const initial = {
    version: patch?.version ?? "",
    slug: patch?.slug ?? "",
    title: patch?.title ?? "",
    releasedAt: patch ? toLocalInput(patch.releasedAt) : "",
    notes: patch?.notes ?? "",
  };
  const [values, setValues] = useState(initial);
  const save = useSave();
  useUnsavedChanges(JSON.stringify(values) !== JSON.stringify(initial));

  function change(key: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const payload = {
      version: values.version.trim(),
      slug: values.slug.trim() === "" ? null : values.slug.trim(),
      title: values.title.trim() === "" ? null : values.title.trim(),
      releasedAt: new Date(values.releasedAt).toISOString(),
      notes: values.notes.trim() === "" ? null : values.notes,
    };
    const saved = await save.run(
      () => (patch ? updatePatch(patch.id, payload) : createPatch(payload)),
      "Patch saved.",
    );
    if (saved) {
      onSaved();
      onClose();
    }
  }

  return (
    <form className="form admin__form" onSubmit={submit}>
      <h2>{patch ? `Edit ${patch.version}` : "New patch"}</h2>
      <FormField
        label="Version"
        name="version"
        required
        value={values.version}
        error={save.fieldErrors.version}
        onChange={(event) => change("version", event.target.value)}
      />
      <FormField
        label="Slug"
        name="slug"
        value={values.slug}
        error={save.fieldErrors.slug}
        hint="Leave empty to generate it from the version."
        onChange={(event) => change("slug", event.target.value)}
      />
      <FormField
        label="Title"
        name="title"
        value={values.title}
        error={save.fieldErrors.title}
        onChange={(event) => change("title", event.target.value)}
      />
      <FormField
        label="Released at"
        name="releasedAt"
        type="datetime-local"
        required
        value={values.releasedAt}
        error={save.fieldErrors.releasedAt}
        onChange={(event) => change("releasedAt", event.target.value)}
      />
      <TextAreaField
        label="Notes"
        name="notes"
        rows={8}
        value={values.notes}
        error={save.fieldErrors.notes}
        onChange={(event) => change("notes", event.target.value)}
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
          Cancel
        </button>
      </div>
    </form>
  );
}

export function PatchesAdminPage() {
  usePageTitle("Admin: patches");
  const patches = useFetch(fetchPatches, []);
  const [editing, setEditing] = useState<Patch | "new" | null>(null);
  const [deleting, setDeleting] = useState<Patch | null>(null);
  const removal = useSave();
  const importing = useSave();

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    const removed = await removal.run(
      () => deletePatch(deleting.id),
      "Patch deleted.",
    );
    if (removed) {
      patches.reload();
    }
    setDeleting(null);
  }

  async function importFromBlizzard() {
    const imported = await importing.run(importPatches, "Patches imported.");
    if (imported) {
      patches.reload();
    }
  }

  return (
    <>
      <PageHeader
        title="Patches"
        actions={
          <>
            <button
              type="button"
              className="button button--ghost"
              disabled={importing.saving}
              onClick={() => void importFromBlizzard()}
            >
              Import from Blizzard
            </button>
            <button
              type="button"
              className="button"
              onClick={() => setEditing("new")}
            >
              New patch
            </button>
          </>
        }
      />
      <StatusMessage error={importing.error} />
      <StatusMessage error={removal.error} />
      {patches.loading && <Spinner />}
      {patches.error && (
        <ErrorMessage failure={patches.error} onRetry={patches.reload} />
      )}
      {patches.data && (
        <DataTable
          rows={patches.data}
          rowKey={(patch) => patch.id}
          emptyMessage="No patches yet."
          columns={[
            {
              header: "Version",
              render: (patch) => (
                <span className="nowrap">{patch.version}</span>
              ),
            },
            { header: "Title", render: (patch) => patch.title ?? "" },
            {
              header: "Released",
              render: (patch) => (
                <span className="nowrap">
                  {formatDateTime(patch.releasedAt)}
                </span>
              ),
            },
            {
              header: "",
              render: (patch) => (
                <div className="form__actions">
                  <button
                    type="button"
                    className="button button--ghost"
                    onClick={() => setEditing(patch)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="button button--ghost"
                    onClick={() => setDeleting(patch)}
                  >
                    Delete
                  </button>
                </div>
              ),
            },
          ]}
        />
      )}
      {editing && (
        <Drawer label="Patch" onClose={() => setEditing(null)}>
          <PatchForm
            key={editing === "new" ? "new" : editing.id}
            patch={editing === "new" ? null : editing}
            onSaved={patches.reload}
            onClose={() => setEditing(null)}
          />
        </Drawer>
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete patch"
          message={`Delete patch ${deleting.version}? This cannot be undone.`}
          busy={removal.saving}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  );
}
