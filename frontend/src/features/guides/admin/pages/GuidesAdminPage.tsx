import { useState } from "react";
import { Link } from "react-router-dom";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { PageHeader } from "../../../../components/ui/PageHeader";
import { Spinner } from "../../../../components/ui/Spinner";
import { useFetch } from "../../../../hooks/useFetch";
import { usePageTitle } from "../../../../hooks/usePageTitle";
import type { Guide } from "../../../../types/guide";
import { deleteGuide, fetchAdminGuides } from "../api/guidesAdminApi";
import { fetchAdminMaps } from "../../../maps/admin";
import { ConfirmDialog } from "../../../../components/admin/ConfirmDialog";
import { DataTable } from "../../../../components/admin/DataTable";
import { Drawer } from "../../../../components/admin/Drawer";
import { HeroLabel } from "../../../heroes/admin";
import { HeroSelect } from "../../../heroes/admin";
import { GuideForm } from "../components/GuideForm";
import { StatusMessage } from "../../../../components/admin/StatusMessage";
import { useHeroOptions } from "../../../heroes/admin";
import { useSave } from "../../../../components/admin/useSave";

export function GuidesAdminPage() {
  usePageTitle("Admin: guides");
  const guides = useFetch(fetchAdminGuides, []);
  const heroes = useHeroOptions();
  const maps = useFetch(fetchAdminMaps, []);
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState<Guide | "new" | null>(null);
  const [deleting, setDeleting] = useState<Guide | null>(null);
  const removal = useSave();
  const rows = (guides.data ?? []).filter(
    (guide) => filter === "" || guide.heroSlug === filter,
  );

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    const removed = await removal.run(
      () => deleteGuide(deleting.id),
      "Guide deleted.",
    );
    if (removed) {
      guides.reload();
    }
    setDeleting(null);
  }

  return (
    <>
      <PageHeader
        title="Guides"
        actions={
          <button
            type="button"
            className="button"
            onClick={() => setEditing("new")}
          >
            New guide
          </button>
        }
      />
      {heroes.data && (
        <HeroSelect
          label="Filter by hero"
          value={filter}
          heroes={heroes.data}
          allLabel="All heroes"
          onChange={setFilter}
        />
      )}
      <StatusMessage error={removal.error} />
      {guides.loading && <Spinner />}
      {guides.error && (
        <ErrorMessage failure={guides.error} onRetry={guides.reload} />
      )}
      {guides.data && (
        <DataTable
          rows={rows}
          rowKey={(guide) => guide.id}
          emptyMessage="No guides yet."
          columns={[
            { header: "Title", render: (guide) => guide.title },
            {
              header: "Hero",
              render: (guide) =>
                heroes.data ? (
                  <HeroLabel slug={guide.heroSlug} heroes={heroes.data} />
                ) : (
                  guide.heroName
                ),
            },
            { header: "Map", render: (guide) => guide.mapName ?? "Any" },
            { header: "Order", render: (guide) => guide.sortOrder },
            {
              header: "Status",
              render: (guide) =>
                guide.published ? (
                  <Link to={`/guides/${guide.path}`}>Published</Link>
                ) : (
                  "Draft"
                ),
            },
            {
              header: "",
              render: (guide) => (
                <div className="form__actions">
                  <button
                    type="button"
                    className="button button--ghost"
                    onClick={() => setEditing(guide)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="button button--ghost button--danger-ghost"
                    onClick={() => setDeleting(guide)}
                  >
                    Delete
                  </button>
                </div>
              ),
            },
          ]}
        />
      )}
      {editing && heroes.data && (
        <Drawer label="Guide" onClose={() => setEditing(null)}>
          <GuideForm
            key={editing === "new" ? "new" : editing.id}
            guide={editing === "new" ? null : editing}
            heroes={heroes.data}
            maps={maps.data ?? []}
            onSaved={guides.reload}
            onClose={() => setEditing(null)}
          />
        </Drawer>
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete guide"
          message={`Delete the guide "${deleting.title}"? This cannot be undone.`}
          busy={removal.saving}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  );
}
