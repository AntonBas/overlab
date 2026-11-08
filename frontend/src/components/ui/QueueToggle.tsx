import clsx from "clsx";
import type { GameQueue } from "../../types/api";
import { QUEUE_LABELS } from "../../utils/format";

const QUEUES: readonly GameQueue[] = ["QUICK_PLAY", "COMPETITIVE"];

interface QueueToggleProps {
  value: GameQueue;
  onChange: (queue: GameQueue) => void;
}

export function QueueToggle({ value, onChange }: QueueToggleProps) {
  return (
    <div className="segmented" role="group" aria-label="Game mode">
      {QUEUES.map((queue) => (
        <button
          key={queue}
          type="button"
          className={clsx("segmented__item", {
            "segmented__item--active": value === queue,
          })}
          aria-pressed={value === queue}
          onClick={() => onChange(queue)}
        >
          {QUEUE_LABELS[queue]}
        </button>
      ))}
    </div>
  );
}
