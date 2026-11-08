import { usePersonalData } from "../context/usePersonalData";
import { useRequireLogin } from "../hooks/useRequireLogin";
import "../personal.css";

interface FavoriteButtonProps {
  kind: "hero" | "map";
  slug: string;
  name: string;
  compact?: boolean;
}

export function FavoriteButton({
  kind,
  slug,
  name,
  compact = false,
}: FavoriteButtonProps) {
  const { signedIn, sendToLogin } = useRequireLogin();
  const personal = usePersonalData();
  const favorite =
    kind === "hero"
      ? personal.favoriteHeroes.has(slug)
      : personal.favoriteMaps.has(slug);
  const toggle =
    kind === "hero" ? personal.toggleHeroFavorite : personal.toggleMapFavorite;

  return (
    <>
      <button
        type="button"
        className={
          compact ? "favorite-star" : "button button--ghost favorite-button"
        }
        aria-pressed={favorite}
        aria-label={
          favorite
            ? `Remove ${name} from favorites`
            : `Add ${name} to favorites`
        }
        onClick={() => (signedIn ? void toggle(slug) : sendToLogin())}
      >
        <span aria-hidden="true">{favorite ? "★" : "☆"}</span>
        {!compact && (favorite ? " Favorite" : " Add to favorites")}
      </button>
      {personal.failure && (
        <span className="form-field__error" role="alert">
          {personal.failure}
        </span>
      )}
    </>
  );
}
