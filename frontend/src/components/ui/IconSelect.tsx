import clsx from "clsx";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
export interface IconSelectOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

interface IconSelectProps<T extends string> {
  label: string;
  value: T;
  options: readonly IconSelectOption<T>[];
  wide?: boolean;
  disabled?: boolean;
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
  disabled = false,
  onChange,
}: IconSelectProps<T>) {
  const values = options.map((option) => option.value);
  const selected =
    options.find((option) => option.value === value) ?? options[0];
  const identifier = useId();
  const labelId = `${identifier}-label`;
  const listId = `${identifier}-list`;
  const optionId = (index: number) => `${identifier}-${index}`;
  const container = useRef<HTMLDivElement>(null);
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

  function openList() {
    setHighlighted(values.indexOf(value));
    setOpen(true);
  }

  function choose(option: IconSelectOption<T>) {
    onChange(option.value);
    setOpen(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "Tab") {
      setOpen(false);
      return;
    }
    const arrow =
      event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;
    if (arrow !== 0) {
      event.preventDefault();
      if (!open) {
        openList();
        return;
      }
      setHighlighted((current) =>
        Math.min(options.length - 1, Math.max(0, current + arrow)),
      );
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open) {
        choose(options[highlighted]);
      } else {
        openList();
      }
    }
  }

  return (
    <div
      className={clsx("field icon-select", { "icon-select--wide": wide })}
      ref={container}
    >
      <span className="field__label" id={labelId}>
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
        title={selected.label}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={handleKeyDown}
      >
        <OptionContent option={selected} reserveIconSpace={false} />
      </button>
      {open && (
        <ul
          className="icon-select__list"
          id={listId}
          role="listbox"
          aria-labelledby={labelId}
        >
          {options.map((option, index) => (
            <li
              key={option.value}
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
          ))}
        </ul>
      )}
    </div>
  );
}
