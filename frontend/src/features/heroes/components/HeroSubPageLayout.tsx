import { SectionLink } from "../../../components/ui/SectionLink";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Carousel } from "../../../components/ui/Carousel";
import { HeroPortrait } from "../../../components/ui/HeroPortrait";
import { PageHeader } from "../../../components/ui/PageHeader";
import type { Hero } from "../../../types/hero";

const HEROES_PER_VIEW = 7;
const HERO_TILE_MIN_WIDTH = 104;
const HERO_TILE_GAP = 12;

interface HeroSubPageLayoutProps {
  hero: Hero;
  allHeroes: Hero[];
  section: string;
  allHref?: string;
  allLabel?: string;
  sectionPath?: string;
  linkSuffix?: string;
  title: string;
  subtitle: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

export function HeroSubPageLayout({
  hero,
  allHeroes,
  section,
  allHref,
  allLabel,
  sectionPath,
  linkSuffix = "",
  title,
  subtitle,
  actions,
  children,
}: HeroSubPageLayoutProps) {
  const sameRole = allHeroes.filter(
    (other) => other.role === hero.role && other.slug !== hero.slug,
  );
  return (
    <div className="hero-page" data-role={hero.role.toLowerCase()}>
      <nav className="guide__crumbs" aria-label="Breadcrumb">
        <Link to="/heroes">Heroes</Link>
        <span aria-hidden="true">&rsaquo;</span>
        <Link to={`/heroes/${hero.slug}`}>{hero.name}</Link>
        <span aria-hidden="true">&rsaquo;</span>
        {allHref ? (
          <Link to={allHref}>{section}</Link>
        ) : (
          <span aria-current="page">{section}</span>
        )}
      </nav>
      <PageHeader
        title={title}
        subtitle={subtitle}
        image={
          <Link
            to={`/heroes/${hero.slug}`}
            aria-label={`${hero.name}: full hero page`}
          >
            <HeroPortrait name={hero.name} url={hero.portraitUrl} size={64} />
          </Link>
        }
        actions={
          <>
            {actions}
            <Link className="button button--ghost" to={`/heroes/${hero.slug}`}>
              Full {hero.name} page
            </Link>
          </>
        }
      />
      {children}
      {sameRole.length > 0 && (
        <section className="section" aria-labelledby="more-heroes-heading">
          <div className="section__heading">
            <h2 id="more-heroes-heading">More heroes</h2>
            {allHref && allLabel && (
              <SectionLink to={allHref}>{allLabel}</SectionLink>
            )}
          </div>
          <Carousel
            items={sameRole.map((other) => ({
              key: other.slug,
              content: (
                <Link
                  className="hero-tile"
                  data-role={other.role.toLowerCase()}
                  to={`/heroes/${other.slug}${sectionPath ? `/${sectionPath}` : ""}${linkSuffix}`}
                >
                  <HeroPortrait
                    name={other.name}
                    url={other.portraitUrl}
                    size={56}
                  />
                  <span className="hero-tile__name">{other.name}</span>
                </Link>
              ),
            }))}
            itemsPerView={HEROES_PER_VIEW}
            minItemWidth={HERO_TILE_MIN_WIDTH}
            gap={HERO_TILE_GAP}
            previousLabel="Previous heroes"
            nextLabel="Next heroes"
          />
        </section>
      )}
    </div>
  );
}
