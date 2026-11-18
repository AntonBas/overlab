import clsx from "clsx";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ShowMoreButtonProps {
  label: string;
  expandedLabel?: string;
  expanded?: boolean;
  attached?: boolean;
  onClick: () => void;
}

export function ShowMoreButton({
  label,
  expandedLabel,
  expanded = false,
  attached = false,
  onClick,
}: ShowMoreButtonProps) {
  const Chevron = expanded ? ChevronUp : ChevronDown;
  return (
    <button
      type="button"
      className={clsx("show-more", { "show-more--attached": attached })}
      aria-expanded={expandedLabel ? expanded : undefined}
      onClick={onClick}
    >
      {expanded && expandedLabel ? expandedLabel : label}
      <Chevron size={18} aria-hidden="true" />
    </button>
  );
}
