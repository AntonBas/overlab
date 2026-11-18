import type { RequestFailure } from "../../services/api";
import { FlaskIcon } from "./FlaskIcon";
import { NotFound } from "./NotFound";

function describeFailure(failure: RequestFailure): string {
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
  if (failure.status === 404) {
    return <NotFound alert />;
  }
  return (
    <div className="notice notice--error notice--centered" role="alert">
      <FlaskIcon variant="error" />
      <p>{describeFailure(failure)}</p>
      {onRetry &&
        (failure.network ||
          failure.status === 429 ||
          failure.status >= 500) && (
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
