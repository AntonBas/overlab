import { Link, Navigate } from "react-router-dom";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { HeroPortrait } from "../../../components/ui/HeroPortrait";
import { ModeIcon } from "../../../components/ui/ModeIcon";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Spinner } from "../../../components/ui/Spinner";
import { Thumbnail } from "../../../components/ui/Thumbnail";
import { useHeroPortraits } from "../../../hooks/useCatalog";
import { useFetch } from "../../../hooks/useFetch";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { useAuth } from "../../auth/context/useAuth";
import { SettingsSection } from "../../account/components/SettingsSection";
import { fetchFavorites, fetchNotes } from "../api/personalApi";
import { PreferencesForm } from "../components/PreferencesForm";
import { usePersonalData } from "../context/usePersonalData";

export function MyLibraryPage() {
  usePageTitle("My Overlab");
  const { user, loading } = useAuth();
  const personal = usePersonalData();
  const favorites = useFetch(
    () => (user ? fetchFavorites() : Promise.resolve(null)),
    [user?.id, personal.favoriteHeroes, personal.favoriteMaps],
    { keepPrevious: true },
  );
  const heroPortraits = useHeroPortraits();
  const notes = useFetch(
    () => (user ? fetchNotes() : Promise.resolve([])),
    [user?.id],
  );

  if (loading) {
    return <Spinner />;
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: "/me" }} />;
  }

  return (
    <div className="settings">
      <PageHeader
        title="My Overlab"
        subtitle={user.displayName}
        actions={
          <Link className="button button--ghost" to="/me/settings">
            Account settings
          </Link>
        }
      />
      <SettingsSection title="Favorite heroes">
        {favorites.error && (
          <ErrorMessage failure={favorites.error} onRetry={favorites.reload} />
        )}
        {favorites.data && favorites.data.heroes.length === 0 && (
          <EmptyState>Use the star on a hero page to keep it here.</EmptyState>
        )}
        {favorites.data && favorites.data.heroes.length > 0 && (
          <ul className="link-list">
            {favorites.data.heroes.map((hero) => (
              <li key={hero.slug}>
                <span className="place-icon">
                  <HeroPortrait
                    name={hero.name}
                    url={hero.portraitUrl}
                    size={28}
                  />
                  <Link to={`/heroes/${hero.slug}`}>{hero.name}</Link>
                </span>
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() => void personal.toggleHeroFavorite(hero.slug)}
                >
                  Remove {hero.name}
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
          <ul className="link-list">
            {favorites.data.maps.map((map) => (
              <li key={map.slug}>
                <span className="place-icon">
                  <Thumbnail url={map.imageUrl} width={48} height={27} />
                  {map.mode && <ModeIcon mode={map.mode} />}
                  <Link to={`/maps/${map.slug}`}>{map.name}</Link>
                </span>
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() => void personal.toggleMapFavorite(map.slug)}
                >
                  Remove {map.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </SettingsSection>
      <SettingsSection
        title="Notes"
        description="Private notes you wrote on hero pages."
      >
        {notes.error && (
          <ErrorMessage failure={notes.error} onRetry={notes.reload} />
        )}
        {notes.data && notes.data.length === 0 && (
          <EmptyState>No notes yet.</EmptyState>
        )}
        {notes.data && notes.data.length > 0 && (
          <ul className="link-list">
            {notes.data.map((note) => (
              <li key={note.heroSlug}>
                <span className="place-icon">
                  <HeroPortrait
                    name={note.heroName}
                    url={heroPortraits[note.heroSlug] ?? null}
                    size={28}
                  />
                  <Link to={`/heroes/${note.heroSlug}`}>{note.heroName}</Link>
                </span>
                <p className="note-preview">{note.content}</p>
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
