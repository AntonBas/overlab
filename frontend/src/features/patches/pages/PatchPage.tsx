import { Link, useParams } from "react-router-dom";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Spinner } from "../../../components/ui/Spinner";
import { useFetch } from "../../../hooks/useFetch";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { formatDateTime } from "../../../utils/format";
import { fetchPatch } from "../api/patchesApi";

export function PatchPage() {
  const { slug = "" } = useParams();
  const patch = useFetch(() => fetchPatch(slug), [slug]);
  usePageTitle(patch.data ? `Patch ${patch.data.version}` : null);

  if (patch.loading) {
    return <Spinner />;
  }
  if (patch.error || !patch.data) {
    return patch.error ? (
      <ErrorMessage failure={patch.error} onRetry={patch.reload} />
    ) : null;
  }

  return (
    <>
      <PageHeader
        title={patch.data.title ?? `Patch ${patch.data.version}`}
        subtitle={
          <>
            {patch.data.version} | {formatDateTime(patch.data.releasedAt)} |{" "}
            <Link to="/patches">All patches</Link>
          </>
        }
      />
      {patch.data.notes ? (
        <p className="prose patch-notes">{patch.data.notes}</p>
      ) : (
        <EmptyState>No notes were added for this patch.</EmptyState>
      )}
    </>
  );
}
