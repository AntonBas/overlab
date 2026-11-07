import { useState, type FormEvent } from "react";
import { useRequireLogin } from "../../personal/hooks/useRequireLogin";
import type {
  RelationKind,
  RelationVoteValue,
} from "../api/relationFeedbackApi";
import type { RelationFeedback } from "../hooks/useRelationFeedback";

const MIN_MESSAGE_LENGTH = 10;
const MAX_MESSAGE_LENGTH = 1000;

interface RelationFeedbackActionsProps {
  feedback: RelationFeedback;
  relatedHeroSlug: string;
  relatedHeroName: string;
  type: RelationKind;
}

export function RelationFeedbackActions({
  feedback,
  relatedHeroSlug,
  relatedHeroName,
  type,
}: RelationFeedbackActionsProps) {
  const { sendToLogin } = useRequireLogin();
  const [reporting, setReporting] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const current = feedback.voteOf(relatedHeroSlug, type);
  const trimmedLength = message.trim().length;

  function vote(value: RelationVoteValue) {
    if (!feedback.signedIn) {
      sendToLogin();
      return;
    }
    void feedback.vote(relatedHeroSlug, type, value);
  }

  function openReport() {
    if (!feedback.signedIn) {
      sendToLogin();
      return;
    }
    setSent(false);
    setReporting(true);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSending(true);
    setError(null);
    const failure = await feedback.report(
      relatedHeroSlug,
      type,
      message.trim(),
    );
    setSending(false);
    if (failure === null) {
      setReporting(false);
      setMessage("");
      setSent(true);
    } else {
      setError(failure);
    }
  }

  return (
    <div className="relation-feedback">
      <div className="relation-feedback__actions">
        <button
          type="button"
          className="relation-feedback__button"
          aria-pressed={current === "UP"}
          aria-label={`Agree with ${relatedHeroName}`}
          onClick={() => vote("UP")}
        >
          <span aria-hidden="true">👍</span> Agree
        </button>
        <button
          type="button"
          className="relation-feedback__button"
          aria-pressed={current === "DOWN"}
          aria-label={`Disagree with ${relatedHeroName}`}
          onClick={() => vote("DOWN")}
        >
          <span aria-hidden="true">👎</span> Disagree
        </button>
        <button
          type="button"
          className="relation-feedback__button"
          aria-expanded={reporting}
          aria-label={`Report a mistake about ${relatedHeroName}`}
          onClick={openReport}
        >
          Report a mistake
        </button>
        {sent && (
          <span className="muted" role="status">
            Thanks, we will review it.
          </span>
        )}
      </div>
      {feedback.failure && (
        <span className="form-field__error" role="alert">
          {feedback.failure}
        </span>
      )}
      {reporting && (
        <form className="relation-feedback__form" onSubmit={submit}>
          <label htmlFor={`report-${type}-${relatedHeroSlug}`}>
            What is wrong about {relatedHeroName}?
          </label>
          <textarea
            id={`report-${type}-${relatedHeroSlug}`}
            rows={3}
            maxLength={MAX_MESSAGE_LENGTH}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
          {error && (
            <span className="form-field__error" role="alert">
              {error}
            </span>
          )}
          <div className="form__actions">
            <button
              type="submit"
              className="button"
              disabled={sending || trimmedLength < MIN_MESSAGE_LENGTH}
            >
              Send
            </button>
            <button
              type="button"
              className="button button--ghost"
              onClick={() => setReporting(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
