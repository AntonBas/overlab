import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

interface HeroSectionNavProps {
  sections: { id: string; label: string }[];
}

function scrollToSection(id: string) {
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function HeroSectionNav({ sections }: HeroSectionNavProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const hashHandled = useRef(false);
  const sectionKey = sections.map((section) => section.id).join(",");

  useEffect(() => {
    const target = window.location.hash.slice(1);
    const match = sectionKey
      .split(",")
      .find((sectionId) => sectionId === `hero-${target}`);
    if (!hashHandled.current && match) {
      hashHandled.current = true;
      scrollToSection(match);
    }
  }, [sectionKey]);

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
    <nav className="section-nav" aria-label="Hero sections">
      {sections.map((section) => (
        <button
          key={section.id}
          type="button"
          className={clsx("section-nav__link", {
            "section-nav__link--active": activeId === section.id,
          })}
          aria-current={activeId === section.id ? "true" : undefined}
          onClick={() => {
            const url = new URL(window.location.href);
            url.hash = section.id.replace("hero-", "");
            window.history.replaceState(window.history.state, "", url);
            setActiveId(section.id);
            scrollToSection(section.id);
          }}
        >
          {section.label}
        </button>
      ))}
    </nav>
  );
}
