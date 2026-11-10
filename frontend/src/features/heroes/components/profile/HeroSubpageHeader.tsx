import type { ReactNode } from "react";
import { HeroPortrait } from "../../../../components/ui/HeroPortrait";
import { PageHeader } from "../../../../components/ui/PageHeader";
import { RoleTags } from "../../../../components/ui/RoleTags";
import type { Hero } from "../../../../types/api";
import { SECTION_COPY, type HeroSection } from "../../utils/heroSeo";
import { HeroSubnav } from "./HeroSubnav";

interface HeroSubpageHeaderProps {
  hero: Hero;
  section: HeroSection;
  intro: string;
  linkSuffix?: string;
  actions?: ReactNode;
}

export function HeroSubpageHeader({
  hero,
  section,
  intro,
  linkSuffix,
  actions,
}: HeroSubpageHeaderProps) {
  return (
    <>
      <PageHeader
        title={SECTION_COPY[section].heading(hero.name)}
        image={
          <HeroPortrait name={hero.name} url={hero.portraitUrl} size={72} />
        }
        subtitle={<RoleTags role={hero.role} subrole={hero.subrole} />}
        actions={actions}
      />
      <p className="prose">{intro}</p>
      <HeroSubnav
        slug={hero.slug}
        name={hero.name}
        current={section}
        linkSuffix={linkSuffix}
      />
    </>
  );
}
