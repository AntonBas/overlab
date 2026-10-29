import clsx from "clsx";
import { useRequireLogin } from "../hooks/useRequireLogin";

interface FavoritesFilterButtonProps {
  active: boolean;
  onToggle: () => void;
}

export function FavoritesFilterButton({
  active,
  onToggle,
}: FavoritesFilterButtonProps) {
  const { signedIn, sendToLogin } = useRequireLogin();

  return (
    <div className="field">
      <span className="field__label">Favorites</span>
      <button
        type="button"
        className={clsx("button", { "button--ghost": !active })}
        aria-pressed={active}
        onClick={signedIn ? onToggle : sendToLogin}
      >
        <span aria-hidden="true">{active ? "★" : "☆"}</span> Only favorites
      </button>
    </div>
  );
}
