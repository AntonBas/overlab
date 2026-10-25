import { Link } from "react-router-dom";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { PageHeader } from "../../../components/ui/PageHeader";
import { RoleBadge } from "../../../components/ui/RoleBadge";
import { Spinner } from "../../../components/ui/Spinner";
import { useFetch } from "../../../hooks/useFetch";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { ROLES } from "../../stats/filters";
import { ROLE_LABELS } from "../../../utils/format";
import { fetchHeroes } from "../api/heroesApi";

export function HeroesPage() {
  usePageTitle("Heroes");
  const heroes = useFetch(fetchHeroes, []);
  const data = heroes.data;

  return (
    <>
      <PageHeader
        title="Heroes"
        subtitle="Perks, counters, synergies, map statistics and video guides"
      />
      {heroes.loading && <Spinner />}
      {heroes.error && (
        <ErrorMessage failure={heroes.error} onRetry={heroes.reload} />
      )}
      {data &&
        ROLES.map((role) => (
          <section key={role} className="section">
            <h2>{ROLE_LABELS[role]}</h2>
            <ul className="chip-list">
              {data
                .filter((hero) => hero.role === role)
                .map((hero) => (
                  <li key={hero.slug}>
                    <Link className="chip" to={`/heroes/${hero.slug}`}>
                      <RoleBadge role={hero.role} compact />
                      {hero.name}
                    </Link>
                  </li>
                ))}
            </ul>
          </section>
        ))}
    </>
  );
}
