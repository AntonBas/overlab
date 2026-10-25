import { Link } from "react-router-dom";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Spinner } from "../../../components/ui/Spinner";
import { useFetch } from "../../../hooks/useFetch";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { formatDateTime } from "../../../utils/format";
import { fetchPatches } from "../api/patchesApi";

export function PatchesPage() {
  usePageTitle("Patches");
  const patches = useFetch(fetchPatches, []);

  return (
    <>
      <PageHeader title="Patches" subtitle="Balance and content updates" />
      {patches.loading && <Spinner />}
      {patches.error && (
        <ErrorMessage failure={patches.error} onRetry={patches.reload} />
      )}
      {patches.data && patches.data.length === 0 && (
        <EmptyState>No patches have been recorded yet.</EmptyState>
      )}
      {patches.data && patches.data.length > 0 && (
        <ul className="card-list">
          {patches.data.map((patch) => (
            <li key={patch.id}>
              <Link to={`/patches/${patch.slug}`} className="card card--link">
                <span className="card__body">
                  <strong>{patch.title ?? patch.version}</strong>
                  <span className="muted">
                    {patch.version} | {formatDateTime(patch.releasedAt)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
