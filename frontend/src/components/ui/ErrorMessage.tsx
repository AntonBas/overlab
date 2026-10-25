import type { RequestFailure } from "../../services/api";

function describe(failure: RequestFailure): string {
  if (failure.network) {
    return "The server is not reachable. Try again in a moment.";
  }
  if (failure.status === 429) {
    return "Too many requests. Please wait a minute and try again.";
  }
  if (failure.status === 404) {
    return "We could not find that page or item.";
  }
  if (failure.status >= 500) {
    return "Something went wrong on our side. Please try again later.";
  }
  return failure.message;
}

interface ErrorMessageProps {
  failure: RequestFailure;
  onRetry?: () => void;
}

export function ErrorMessage({ failure, onRetry }: ErrorMessageProps) {
  return (
    <div className="notice notice--error" role="alert">
      <p>{describe(failure)}</p>
      {onRetry && (failure.network || failure.status >= 500) && (
        <button
          type="button"
          className="button button--ghost"
          onClick={onRetry}
        >
          Try again
        </button>
      )}
    </div>
  );
}
