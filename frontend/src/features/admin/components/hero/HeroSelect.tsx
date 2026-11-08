import { useMemo } from "react";
import { AllItemsIcon } from "../../../../components/ui/AllItemsIcon";
import { HeroPortrait } from "../../../../components/ui/HeroPortrait";
import { IconSelect } from "../../../../components/ui/IconSelect";
import type { AdminHero } from "../../types";
import "../../admin.css";

const HERO_ICON_SIZE = 24;

interface HeroSelectProps {
  label: string;
  value: string;
  heroes: readonly AdminHero[];
  allLabel?: string;
  placeholder?: string;
  error?: string;
  onChange: (slug: string) => void;
}

export function HeroSelect({
  label,
  value,
  heroes,
  allLabel,
  placeholder,
  error,
  onChange,
}: HeroSelectProps) {
  const options = useMemo(() => {
    const heroOptions = heroes.map((hero) => ({
      value: hero.slug,
      label: hero.name,
      icon: (
        <HeroPortrait
          name={hero.name}
          url={hero.portraitUrl}
          size={HERO_ICON_SIZE}
        />
      ),
    }));
    if (allLabel !== undefined) {
      return [
        { value: "", label: allLabel, icon: <AllItemsIcon /> },
        ...heroOptions,
      ];
    }
    if (placeholder !== undefined) {
      return [
        { value: "", label: placeholder, icon: undefined },
        ...heroOptions,
      ];
    }
    return heroOptions;
  }, [heroes, allLabel, placeholder]);

  if (options.length === 0) {
    return null;
  }

  return (
    <div className="hero-select">
      <IconSelect
        label={label}
        value={value}
        options={options}
        wide
        searchable
        onChange={onChange}
      />
      {error && <span className="form-field__error">{error}</span>}
    </div>
  );
}
