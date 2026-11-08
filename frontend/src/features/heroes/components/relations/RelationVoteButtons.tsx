import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useRequireLogin } from "../../../personal/hooks/useRequireLogin";
import type {
  RelationKind,
  RelationVoteValue,
} from "../../api/relationFeedbackApi";
import type { RelationFeedback } from "../../hooks/useRelationFeedback";
import "../../heroes.css";

interface RelationVoteButtonsProps {
  feedback: RelationFeedback;
  relatedHeroSlug: string;
  relatedHeroName: string;
  type: RelationKind;
}

export function RelationVoteButtons({
  feedback,
  relatedHeroSlug,
  relatedHeroName,
  type,
}: RelationVoteButtonsProps) {
  const { sendToLogin } = useRequireLogin();
  const current = feedback.voteOf(relatedHeroSlug, type);

  function vote(value: RelationVoteValue) {
    if (!feedback.signedIn) {
      sendToLogin();
      return;
    }
    void feedback.vote(relatedHeroSlug, type, value);
  }

  return (
    <span className="vote-buttons">
      <button
        type="button"
        className="vote-buttons__button"
        aria-pressed={current === "UP"}
        aria-label={`Agree with ${relatedHeroName}`}
        title="I agree"
        onClick={() => vote("UP")}
      >
        <ThumbsUp size={14} aria-hidden="true" />
      </button>
      <button
        type="button"
        className="vote-buttons__button"
        aria-pressed={current === "DOWN"}
        aria-label={`Disagree with ${relatedHeroName}`}
        title="I disagree"
        onClick={() => vote("DOWN")}
      >
        <ThumbsDown size={14} aria-hidden="true" />
      </button>
      {feedback.failure && (
        <span className="form-field__error" role="alert">
          {feedback.failure}
        </span>
      )}
    </span>
  );
}
