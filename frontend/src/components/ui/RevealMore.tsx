import { ScrollSentinel } from "./ScrollSentinel";
import { ShowMoreButton } from "./ShowMoreButton";

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
      <ShowMoreButton label={`Show more ${noun}`} onClick={onMore} />
    </>
  );
}
