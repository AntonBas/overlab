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
import { ROLES } from "../../stats";
import { ROLE_LABELS } from "../../../utils/format";
import { fetchHeroes } from "../api/heroesApi";
import { staticSeoPage } from "../../../utils/staticSeoPages";

export function HeroesPage() {
  const page = staticSeoPage("/heroes");
  usePageTitle(page.title);
  usePageDescription(page.description);
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
            <ul className="hero-tiles">
              {data
                .filter((hero) => hero.role === role)
                .map((hero) => (
                  <li key={hero.slug}>
                    <Link
                      className="hero-tile"
                      data-role={hero.role.toLowerCase()}
                      to={`/heroes/${hero.slug}`}
                    >
                      <HeroPortrait
                        name={hero.name}
                        url={hero.portraitUrl}
                        size={56}
                      />
                      <span className="hero-tile__name">{hero.name}</span>
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
