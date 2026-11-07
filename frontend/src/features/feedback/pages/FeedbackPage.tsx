import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PageHeader } from "../../../components/ui/PageHeader";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { toFailure } from "../../../services/api";
import { sendFeedback, type FeedbackType } from "../api/feedbackApi";

const MIN_LENGTH = 10;
const MAX_LENGTH = 2000;

const TYPES: { value: FeedbackType; label: string }[] = [
  { value: "INACCURACY", label: "Inaccuracy or wrong data" },
  { value: "BUG", label: "Bug" },
  { value: "TYPO", label: "Typo" },
  { value: "OTHER", label: "Something else" },
];

function sitePath(value: string | null): string | null {
  return value !== null && value.startsWith("/") && !value.startsWith("//")
    ? value
    : null;
}

export function FeedbackPage() {
  usePageTitle("Send feedback");
  const [searchParams] = useSearchParams();
  const from = sitePath(searchParams.get("from"));
  const [type, setType] = useState<FeedbackType>("INACCURACY");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const length = message.trim().length;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSending(true);
    setError(null);
    try {
      await sendFeedback({ type, message: message.trim(), pagePath: from });
      setSent(true);
    } catch (failure) {
      setError(toFailure(failure).message);
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <>
        <PageHeader title="Thank you" />
        <p role="status">Your message was sent. We read every one of them.</p>
        <p>
          <Link to={from ?? "/"}>{from ? "Back to the page" : "Home"}</Link>
        </p>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Send feedback"
        subtitle="Found a wrong number, a bug or a typo? Tell us."
      />
      <form className="form" onSubmit={submit}>
        <div className="form-field">
          <label htmlFor="feedback-type">What is it about?</label>
          <select
            id="feedback-type"
            value={type}
            onChange={(event) => setType(event.target.value as FeedbackType)}
          >
            {TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="feedback-message">Message</label>
          <textarea
            id="feedback-message"
            rows={6}
            maxLength={MAX_LENGTH}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
          <span className="muted">
            {from ? `About ${from}. ` : ""}At least {MIN_LENGTH} characters (
            {length}/{MAX_LENGTH}).
          </span>
        </div>
        {error && (
          <p className="notice notice--error" role="alert">
            {error}
          </p>
        )}
        <div className="form__actions">
          <button
            type="submit"
            className="button"
            disabled={sending || length < MIN_LENGTH}
          >
            Send
          </button>
        </div>
      </form>
    </>
  );
}
