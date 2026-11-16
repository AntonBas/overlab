import { ScrollSentinel } from "./ScrollSentinel";

interface RevealMoreProps {
  remaining: number;
  shown: number;
  noun: string;
  onMore: () => void;
}

export function RevealMore({
  remaining,
  shown,
  noun,
  onMore,
}: RevealMoreProps) {
  if (remaining <= 0) {
    return null;
  }
  return (
    <>
      <ScrollSentinel onReach={onMore} resetKey={shown} />
      <button
        type="button"
        className="button button--ghost reveal-more"
        onClick={onMore}
      >
        Show more {noun} ({remaining} left)
      </button>
    </>
  );
}
