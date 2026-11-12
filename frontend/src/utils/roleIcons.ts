import type { HeroRole } from "../types/hero";

const availability = new Map<HeroRole, Promise<boolean>>();

export function roleIconUrl(role: HeroRole): string {
  return `/media/roles/${role.toLowerCase()}.svg`;
}

export function checkRoleIcon(role: HeroRole): Promise<boolean> {
  const known = availability.get(role);
  if (known) {
    return known;
  }
  const check = new Promise<boolean>((resolve) => {
    const image = new Image();
    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
    image.src = roleIconUrl(role);
  });
  availability.set(role, check);
  return check;
}

export function resetRoleIconChecks() {
  availability.clear();
}
