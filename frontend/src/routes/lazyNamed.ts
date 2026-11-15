import { lazy, type ComponentType, type LazyExoticComponent } from "react";

export function lazyNamed<Name extends string>(
  load: () => Promise<Record<Name, ComponentType>>,
  name: Name,
): LazyExoticComponent<ComponentType> {
  return lazy(() => load().then((module) => ({ default: module[name] })));
}
