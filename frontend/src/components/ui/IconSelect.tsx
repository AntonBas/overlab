import clsx from "clsx";
import {
  useEffect,
  useId,
  useRef,
  useState,
  Fragment,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { matchesName } from "../../utils/search";
export interface IconSelectOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
  group?: string;
}

interface IconSelectProps<T extends string> {
  label: string;
  value: T;
  options: readonly IconSelectOption<T>[];
  wide?: boolean;
  hideLabel?: boolean;
  disabled?: boolean;
  searchable?: boolean;
  onChange: (value: T) => void;
}

function OptionContent<T extends string>({
  option,
  reserveIconSpace,
}: {
  option: IconSelectOption<T>;
  reserveIconSpace: boolean;
}) {
  return (
    <span className="icon-select__content">
      {(option.icon || reserveIconSpace) && (
        <span className="icon-select__icon">{option.icon}</span>
      )}
      <span className="icon-select__label">{option.label}</span>
    </span>
  );
}

export function IconSelect<T extends string>({
  label,
  value,
  options,
  wide = false,
  hideLabel = false,
  disabled = false,
  searchable = false,
  onChange,
}: IconSelectProps<T>) {
  const [query, setQuery] = useState("");
  const visibleOptions =
    searchable && query.trim() !== ""
      ? options.filter((option) => matchesName(option.label, query))
      : options;
  const values = visibleOptions.map((option) => option.value);
  const selected =
    options.find((option) => option.value === value) ?? options[0];
  const identifier = useId();
  const labelId = `${identifier}-label`;
  const listId = `${identifier}-list`;
  const optionId = (index: number) => `${identifier}-${index}`;
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(values.indexOf(value));

  useEffect(() => {
    if (!open) {
      return;
    }
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!container.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [open]);

  useEffect(() => {
    if (open && searchable) {
      search.current?.focus();
    }
  }, [open, searchable]);

  function openList() {
    setQuery("");
    setHighlighted(options.findIndex((option) => option.value === value));
    setOpen(true);
  }

  function closeList() {
    setOpen(false);
    if (searchable) {
      trigger.current?.focus();
    }
  }

  function choose(option: IconSelectOption<T>) {
    onChange(option.value);
    closeList();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      closeList();
      return;
    }
    if (event.key === "Tab") {
      setOpen(false);
      return;
    }
    const typing = event.target instanceof HTMLInputElement;
    const arrow =
      event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;
    if (arrow !== 0) {
      event.preventDefault();
      if (!open) {
        openList();
        return;
      }
      setHighlighted((current) =>
        Math.min(visibleOptions.length - 1, Math.max(0, current + arrow)),
      );
      return;
    }
    if (event.key === " " && typing) {
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!open) {
        openList();
      } else if (visibleOptions[highlighted]) {
        choose(visibleOptions[highlighted]);
      }
    }
  }

  return (
    <div
      className={clsx("field icon-select", { "icon-select--wide": wide })}
      ref={container}
    >
      <span
        className={clsx("field__label", { "visually-hidden": hideLabel })}
        id={labelId}
      >
        {label}
      </span>
      <button
        type="button"
        role="combobox"
        className="icon-select__trigger"
        aria-labelledby={labelId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? optionId(highlighted) : undefined}
        title={selected?.label}
        disabled={disabled || options.length === 0}
        ref={trigger}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={handleKeyDown}
      >
        {selected ? (
          <OptionContent option={selected} reserveIconSpace={false} />
        ) : (
          <span className="icon-select__empty">No options</span>
        )}
      </button>
      {open && (
        <ul
          className="icon-select__list"
          id={listId}
          role="listbox"
          aria-labelledby={labelId}
        >
          {searchable && (
            <li role="presentation" className="icon-select__search">
              <input
                ref={search}
                type="search"
                value={query}
                placeholder="Type to search"
                aria-label={`Search ${label.toLowerCase()}`}
                autoComplete="off"
                onChange={(event) => {
                  setQuery(event.target.value);
                  setHighlighted(0);
                }}
                onKeyDown={handleKeyDown}
              />
            </li>
          )}
          {visibleOptions.length === 0 && (
            <li role="presentation" className="icon-select__empty">
              Nothing found
            </li>
          )}
          {visibleOptions.map((option, index) => (
            <Fragment key={option.value}>
              {option.group &&
                option.group !== visibleOptions[index - 1]?.group && (
                  <li role="presentation" className="icon-select__group">
                    {option.group}
                  </li>
                )}
              <li
                id={optionId(index)}
                role="option"
                aria-selected={option.value === value}
                className={clsx("icon-select__option", {
                  "icon-select__option--highlighted": index === highlighted,
                  "icon-select__option--selected": option.value === value,
                })}
                onMouseEnter={() => setHighlighted(index)}
                onClick={() => choose(option)}
              >
                <OptionContent option={option} reserveIconSpace />
              </li>
            </Fragment>
          ))}
        </ul>
      )}
    </div>
  );
}
