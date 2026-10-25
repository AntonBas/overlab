import { Link, useParams } from "react-router-dom";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Spinner } from "../../../components/ui/Spinner";
import { useFetch } from "../../../hooks/useFetch";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { formatDateTime } from "../../../utils/format";
import { ChangesTable } from "../../history/components/ChangesTable";
import { fetchComparison } from "../../stats/api/statsApi";
import { fetchPatch } from "../api/patchesApi";

export function PatchPage() {
  const { slug = "" } = useParams();
  const patch = useFetch(() => fetchPatch(slug), [slug]);
  const comparison = useFetch(
    () =>
      fetchComparison({
        queue: "COMPETITIVE",
        tier: "ALL",
        platform: "PC",
        region: "EUROPE",
        patch: slug,
      }),
    [slug],
  );
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
      <section className="section">
        <h2>Statistics before and after</h2>
        {comparison.loading && <Spinner label="Loading comparison" />}
        {comparison.error &&
          (comparison.error.status === 404 ? (
            <EmptyState>
              There are no snapshots around this release yet, so the change
              cannot be shown.
            </EmptyState>
          ) : (
            <ErrorMessage
              failure={comparison.error}
              onRetry={comparison.reload}
            />
          ))}
        {comparison.data && (
          <>
            <p className="muted footnote">
              The last snapshot before the release (
              {formatDateTime(comparison.data.beforeCapturedAt)}) compared with
              the one a week later (
              {formatDateTime(comparison.data.afterCapturedAt)}). Competitive,
              all ranks, PC, Europe.
            </p>
            <ChangesTable changes={comparison.data.heroes} showBan />
          </>
        )}
      </section>
    </>
  );
}
