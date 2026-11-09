import { Search } from "lucide-react";
import { useId, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { fetchHeroes } from "../../features/heroes/api/heroesApi";
import type { Hero } from "../../types/api";
import { HeroPortrait } from "../ui/HeroPortrait";
import { matchHeroes } from "../../utils/search";

export function HeroSearch() {
  const navigate = useNavigate();
  const listId = useId();
  const [heroes, setHeroes] = useState<Hero[] | null>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const results = matchHeroes(heroes ?? [], query);
  const expanded = open && results.length > 0;

  function loadHeroes() {
    setOpen(true);
    if (heroes === null) {
      fetchHeroes()
        .then(setHeroes)
        .catch(() => setHeroes([]));
    }
  }

  function go(hero: Hero) {
    setQuery("");
    setOpen(false);
    navigate(`/heroes/${hero.slug}`);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && results.length > 0) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => (current + 1) % results.length);
    } else if (event.key === "ArrowUp" && results.length > 0) {
      event.preventDefault();
      setActiveIndex(
        (current) => (current - 1 + results.length) % results.length,
      );
    } else if (event.key === "Enter" && expanded) {
      event.preventDefault();
      go(results[Math.min(activeIndex, results.length - 1)]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  const activeId = expanded ? `${listId}-${activeIndex}` : undefined;

  return (
    <div className="hero-search" role="search">
      <Search aria-hidden="true" size={16} />
      <input
        type="search"
        role="combobox"
        aria-label="Find a hero"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-activedescendant={activeId}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder="Find hero"
        value={query}
        onFocus={loadHeroes}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        onChange={(event) => {
          setQuery(event.target.value);
          setActiveIndex(0);
          setOpen(true);
        }}
      />
      <ul
        id={listId}
        role="listbox"
        className="hero-search__list"
        hidden={!expanded}
      >
        {results.map((hero, index) => (
          <li
            key={hero.slug}
            id={`${listId}-${index}`}
            role="option"
            aria-selected={index === activeIndex}
            className={
              index === activeIndex
                ? "hero-search__option hero-search__option--active"
                : "hero-search__option"
            }
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => go(hero)}
          >
            <HeroPortrait name={hero.name} url={hero.portraitUrl} size={24} />
            {hero.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
