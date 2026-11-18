import clsx from "clsx";
import type { ReactNode } from "react";
import type { HeroRole } from "../../../types/hero";
import {
  heroBackdropStyle,
  useHeroBackdrop,
} from "../../../utils/heroBackdrop";

interface BackdropCardProps {
  slug: string;
  role: HeroRole;
  children: ReactNode;
}

export function BackdropCard({ slug, role, children }: BackdropCardProps) {
  const backdrop = useHeroBackdrop(slug);
  return (
    <article
      className={clsx("hero-perks", `hero-perks--${role.toLowerCase()}`, {
        "hero-perks--backdrop": backdrop !== undefined,
      })}
      style={backdrop ? heroBackdropStyle(backdrop) : undefined}
    >
      {children}
    </article>
  );
}
