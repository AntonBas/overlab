import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { HeroPortrait } from "../../../components/ui/HeroPortrait";
import { FavoriteButton } from "../../personal";
import { preferredScrollBehavior } from "../../../utils/motion";
import { holdElementInView } from "../../../utils/restoreScroll";

interface HeroSectionNavProps {
  sections: { id: string; label: string }[];
  hero?: { slug: string; name: string; portraitUrl: string | null };
}

function scrollToSection(id: string) {
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: preferredScrollBehavior(), block: "start" });
}

export function HeroSectionNav({ sections, hero }: HeroSectionNavProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [stuck, setStuck] = useState(false);
  const nav = useRef<HTMLElement>(null);
  const hashHandled = useRef(false);
  const releaseHold = useRef<(() => void) | null>(null);
  const sectionKey = sections.map((section) => section.id).join(",");

  useEffect(() => {
    const target = window.location.hash.slice(1);
    const match = sectionKey
      .split(",")
      .find((sectionId) => sectionId === `hero-${target}`);
    if (!hashHandled.current && match && document.getElementById(match)) {
      hashHandled.current = true;
      releaseHold.current = holdElementInView(() =>
        document.getElementById(match),
      );
    }
  }, [sectionKey]);

  useEffect(() => () => releaseHold.current?.(), []);

  useEffect(() => {
    function update() {
      const element = nav.current;
      if (!element) {
        return;
      }
      const stickyTop = parseFloat(getComputedStyle(element).top) || 0;
      setStuck(element.getBoundingClientRect().top <= stickyTop + 1);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      return;
    }
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visible.add(entry.target.id);
          } else {
            visible.delete(entry.target.id);
          }
        });
        const first = sectionKey
          .split(",")
          .find((sectionId) => visible.has(sectionId));
        if (first) {
          setActiveId(first);
        }
      },
      { rootMargin: "-120px 0px -60% 0px" },
    );
    sectionKey.split(",").forEach((sectionId) => {
      const element = document.getElementById(sectionId);
      if (element) {
        observer.observe(element);
      }
    });
    return () => observer.disconnect();
  }, [sectionKey]);

  if (sections.length < 2) {
    return null;
  }

  return (
    <nav ref={nav} className="section-nav" aria-label="Hero sections">
      {hero && stuck && (
        <span className="section-nav__identity">
          <HeroPortrait name={hero.name} url={hero.portraitUrl} size={26} />
          <strong>{hero.name}</strong>
          <FavoriteButton
            compact
            kind="hero"
            slug={hero.slug}
            name={hero.name}
          />
        </span>
      )}
      {sections.map((section) => (
        <a
          key={section.id}
          href={`#${section.id.replace("hero-", "")}`}
          className={clsx("section-nav__link", {
            "section-nav__link--active": activeId === section.id,
          })}
          aria-current={activeId === section.id ? "true" : undefined}
          onClick={(event) => {
            event.preventDefault();
            releaseHold.current?.();
            releaseHold.current = null;
            const url = new URL(window.location.href);
            url.hash = section.id.replace("hero-", "");
            window.history.replaceState(window.history.state, "", url);
            setActiveId(section.id);
            scrollToSection(section.id);
          }}
        >
          {section.label}
        </a>
      ))}
    </nav>
  );
}
