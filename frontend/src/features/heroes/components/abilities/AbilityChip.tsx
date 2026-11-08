import clsx from "clsx";
import { useId } from "react";
import { createPortal } from "react-dom";
import { useFloatingTip } from "../../../../hooks/useFloatingTip";
import { Thumbnail } from "../../../../components/ui/Thumbnail";
import type { Ability } from "../../../../types/api";
import { AbilityKey } from "./AbilityKey";
import "../../heroes.css";

export function AbilityChip({ ability }: { ability: Ability }) {
  const tipId = useId();
  const { open, style, triggerRef, tipRef, triggerProps, tipProps } =
    useFloatingTip(0);

  return (
    <span className="ability-chip" ref={triggerRef} {...triggerProps}>
      <button
        type="button"
        className="ability-chip__button"
        aria-describedby={tipId}
      >
        <Thumbnail
          url={ability.iconUrl}
          width={20}
          height={20}
          className="ability-chip__icon"
        />
        {ability.name}
      </button>
      {createPortal(
        <span
          id={tipId}
          role="tooltip"
          ref={tipRef}
          className={clsx("ability-chip__tip", {
            "ability-chip__tip--open": open,
          })}
          style={style}
          {...tipProps}
        >
          <strong>{ability.name}</strong>
          <AbilityKey control={ability.control} showLabel />
          {ability.description && <span>{ability.description}</span>}
        </span>,
        document.body,
      )}
    </span>
  );
}
