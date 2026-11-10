import clsx from "clsx";
import { Link } from "react-router-dom";
import {
  HERO_SECTIONS,
  SECTION_COPY,
  type HeroSection,
} from "../../utils/heroSeo";

interface HeroSubnavProps {
  slug: string;
  name: string;
  current: HeroSection | "overview";
  linkSuffix?: string;
}

export function HeroSubnav({
  slug,
  name,
  current,
  linkSuffix = "",
}: HeroSubnavProps) {
  const links = [
    {
      key: "overview",
      to: `/heroes/${slug}${linkSuffix}`,
      label: `${name} overview`,
    },
    ...HERO_SECTIONS.map((section) => ({
      key: section,
      to: `/heroes/${slug}/${section}${linkSuffix}`,
      label: SECTION_COPY[section].heading(name),
    })),
  ];
  return (
    <nav className="hero-subnav" aria-label={`More about ${name}`}>
      {links.map((link) => (
        <Link
          key={link.key}
          to={link.to}
          className={clsx("section-nav__link", {
            "section-nav__link--active": current === link.key,
          })}
          aria-current={current === link.key ? "page" : undefined}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
