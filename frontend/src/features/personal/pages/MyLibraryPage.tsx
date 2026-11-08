import { X } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { HeroPortrait } from "../../../components/ui/HeroPortrait";
import { ModeIcon } from "../../../components/ui/ModeIcon";
import { RoleBadge } from "../../../components/ui/RoleBadge";
import { Spinner } from "../../../components/ui/Spinner";
import { Thumbnail } from "../../../components/ui/Thumbnail";
import { useFetch } from "../../../hooks/useFetch";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { useAuth } from "../../auth/context/useAuth";
import { AccountHeader } from "../../account/components/AccountHeader";
import { SettingsSection } from "../../account/components/SettingsSection";
import { fetchFavorites } from "../api/personalApi";
import { sortHeroesByRoleThenName } from "../../heroes/utils/sortHeroes";
import { PreferencesForm } from "../components/PreferencesForm";
import { usePersonalData } from "../context/usePersonalData";
import "../personal.css";

export function MyLibraryPage() {
  usePageTitle("My Overlab");
  const { user, loading } = useAuth();
  const personal = usePersonalData();
  const favorites = useFetch(
    () => (user ? fetchFavorites() : Promise.resolve(null)),
    [user?.id, personal.favoriteHeroes, personal.favoriteMaps],
    { keepPrevious: true },
  );

  if (loading) {
    return <Spinner />;
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: "/me" }} />;
  }

  return (
    <div className="settings">
      <AccountHeader user={user} />
      <SettingsSection title="Favorite heroes">
        {favorites.error && (
          <ErrorMessage failure={favorites.error} onRetry={favorites.reload} />
        )}
        {favorites.data && favorites.data.heroes.length === 0 && (
          <EmptyState>Use the star on a hero page to keep it here.</EmptyState>
        )}
        {favorites.data && favorites.data.heroes.length > 0 && (
          <ul className="favorite-grid">
            {sortHeroesByRoleThenName(favorites.data.heroes).map((hero) => (
              <li
                key={hero.slug}
                className={`favorite-grid__item favorite-grid__item--${hero.role.toLowerCase()}`}
              >
                <span className="place-icon">
                  <HeroPortrait
                    name={hero.name}
                    url={hero.portraitUrl}
                    size={28}
                  />
                  <RoleBadge role={hero.role} compact />
                  <Link to={`/heroes/${hero.slug}`}>{hero.name}</Link>
                </span>
                <button
                  type="button"
                  className="favorite-grid__remove"
                  aria-label={`Remove ${hero.name}`}
                  title="Remove from favorites"
                  onClick={() => void personal.toggleHeroFavorite(hero.slug)}
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </SettingsSection>
      <SettingsSection title="Favorite maps">
        {favorites.data && favorites.data.maps.length === 0 && (
          <EmptyState>Use the star on a map page to keep it here.</EmptyState>
        )}
        {favorites.data && favorites.data.maps.length > 0 && (
          <ul className="favorite-grid favorite-grid--wide">
            {favorites.data.maps.map((map) => (
              <li key={map.slug}>
                <span className="place-icon">
                  <Thumbnail url={map.imageUrl} width={48} height={27} />
                  {map.mode && <ModeIcon mode={map.mode} />}
                  <Link to={`/maps/${map.slug}`}>{map.name}</Link>
                </span>
                <button
                  type="button"
                  className="favorite-grid__remove"
                  aria-label={`Remove ${map.name}`}
                  title="Remove from favorites"
                  onClick={() => void personal.toggleMapFavorite(map.slug)}
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </SettingsSection>
      <SettingsSection
        title="Default filters"

        description="Applied when you open statistics without choosing filters."
      >
        {personal.preferencesLoaded ? <PreferencesForm /> : <Spinner />}
      </SettingsSection>
    </div>
  );
}
