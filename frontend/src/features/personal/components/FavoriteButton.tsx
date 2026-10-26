import { useAuth } from "../../auth/context/useAuth";
import { usePersonalData } from "../context/usePersonalData";

interface FavoriteButtonProps {
  kind: "hero" | "map";
  slug: string;
  name: string;
}

export function FavoriteButton({ kind, slug, name }: FavoriteButtonProps) {
  const { user } = useAuth();
  const personal = usePersonalData();

  if (!user) {
    return null;
  }
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
        className="button button--ghost favorite-button"
        aria-pressed={favorite}
        aria-label={
          favorite
            ? `Remove ${name} from favorites`
            : `Add ${name} to favorites`
        }
        onClick={() => void toggle(slug)}
      >
        <span aria-hidden="true">{favorite ? "★" : "☆"}</span>
        {favorite ? " Favorite" : " Add to favorites"}
      </button>
      {personal.failure && (
        <span className="form-field__error" role="alert">
          {personal.failure}
        </span>
      )}
    </>
  );
}
