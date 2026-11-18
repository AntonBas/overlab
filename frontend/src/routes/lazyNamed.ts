import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import { remainingSpinnerTime } from "../components/ui/spinnerTiming";

function holdForSpinner(startedAt: number): Promise<void> {
  const wait = remainingSpinnerTime(Date.now() - startedAt);
  return wait === 0
    ? Promise.resolve()
    : new Promise((resolve) => setTimeout(resolve, wait));
}

export function lazyNamed<Name extends string>(
  load: () => Promise<Record<Name, ComponentType>>,
  name: Name,
): LazyExoticComponent<ComponentType> {
  return lazy(() => {
    const startedAt = Date.now();
    return load().then(async (module) => {
      await holdForSpinner(startedAt);
      return { default: module[name] };
    });
  });
}
