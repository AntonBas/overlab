import type { HeroRole } from "../types/hero";
import { probeImage } from "./probeImage";

const availability = new Map<HeroRole, Promise<boolean>>();

export function roleIconUrl(role: HeroRole): string {
  return `/media/roles/${role.toLowerCase()}.svg`;
}

export function checkRoleIcon(role: HeroRole): Promise<boolean> {
  const known = availability.get(role);
  if (known) {
    return known;
  }
  const check = probeImage(roleIconUrl(role));
  availability.set(role, check);
  return check;
}

export function resetRoleIconChecks() {
  availability.clear();
}
