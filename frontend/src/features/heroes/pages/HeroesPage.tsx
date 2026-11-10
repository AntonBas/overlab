import { Link } from "react-router-dom";
import { NewBadge } from "../../../components/ui/NewBadge";
import { HeroPortrait } from "../../../components/ui/HeroPortrait";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { PageHeader } from "../../../components/ui/PageHeader";
import { RoleBadge } from "../../../components/ui/RoleBadge";
import { Spinner } from "../../../components/ui/Spinner";
import { useFetch } from "../../../hooks/useFetch";
import { usePageTitle } from "../../../hooks/usePageTitle";
import {
  breadcrumbList,
  useStructuredData,
} from "../../../hooks/useStructuredData";
import { usePageDescription } from "../../../hooks/usePageDescription";
import { ROLES } from "../../stats/filters";
import { ROLE_LABELS } from "../../../utils/format";
import { fetchHeroes } from "../api/heroesApi";

export function HeroesPage() {
  usePageTitle("All Overwatch 2 heroes: roles, abilities, perks");
  usePageDescription(
    "All Overwatch 2 heroes with roles, abilities, perks, counters and synergies.",
  );
  useStructuredData(
    breadcrumbList(
      [
        { name: "Overlab", path: "/" },
        { name: "Heroes", path: "/heroes" },
      ],
      window.location.origin,
    ),
  );
  const heroes = useFetch(fetchHeroes, []);
  const data = heroes.data;

  return (
    <>
      <PageHeader
        title="Heroes"
        subtitle="Perks, counters, synergies, map statistics and video guides"
      />
      {heroes.loading && <Spinner page />}
      {heroes.error && (
        <ErrorMessage failure={heroes.error} onRetry={heroes.reload} />
      )}
      {data &&
        ROLES.map((role) => (
          <section key={role} className="section">
            <h2 className="role-heading">
              <RoleBadge role={role} compact />
              {ROLE_LABELS[role]}
            </h2>
            <ul className="chip-list chip-list--centered">
              {data
                .filter((hero) => hero.role === role)
                .map((hero) => (
                  <li key={hero.slug}>
                    <Link className="chip" to={`/heroes/${hero.slug}`}>
                      <HeroPortrait name={hero.name} url={hero.portraitUrl} />
                      {hero.name}
                      {hero.recentlyAdded && <NewBadge />}
                    </Link>
                  </li>
                ))}
            </ul>
          </section>
        ))}
    </>
  );
}
