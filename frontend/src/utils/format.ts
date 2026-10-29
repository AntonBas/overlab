import type {
  GameQueue,
  HeroRole,
  MapMode,
  Platform,
  RankTier,
  Region,
} from "../types/api";

export function formatPercent(value: number | null | undefined): string {
  return value === null || value === undefined ? "-" : `${value.toFixed(1)}%`;
}

export function formatDelta(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }
  const rounded = Math.round(value * 10) / 10;
  if (rounded === 0) {
    return "0.0";
  }
  return `${rounded > 0 ? "+" : "−"}${Math.abs(rounded).toFixed(1)}`;
}

export function formatDateTime(value: string, withZone = false): string {
  const options: Intl.DateTimeFormatOptions = withZone
    ? {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      }
    : { dateStyle: "medium", timeStyle: "short" };
  return new Intl.DateTimeFormat("en-GB", options).format(new Date(value));
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
];

export function formatRelativeTime(value: string, now = Date.now()): string {
  const elapsedSeconds = Math.round((new Date(value).getTime() - now) / 1000);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, secondsInUnit] of RELATIVE_UNITS) {
    if (Math.abs(elapsedSeconds) >= secondsInUnit) {
      return formatter.format(Math.round(elapsedSeconds / secondsInUnit), unit);
    }
  }
  return "just now";
}

export function formatSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export const ROLE_LABELS: Record<HeroRole, string> = {
  TANK: "Tank",
  DAMAGE: "Damage",
  SUPPORT: "Support",
};

export const QUEUE_LABELS: Record<GameQueue, string> = {
  QUICK_PLAY: "Quick Play",
  COMPETITIVE: "Competitive",
};

export const TIER_LABELS: Record<RankTier, string> = {
  ALL: "All ranks",
  BRONZE: "Bronze",
  SILVER: "Silver",
  GOLD: "Gold",
  PLATINUM: "Platinum",
  EMERALD: "Emerald",
  DIAMOND: "Diamond",
  MASTER: "Master",
  GRANDMASTER: "Grandmaster",
};

export const PLATFORM_LABELS: Record<Platform, string> = {
  PC: "PC",
  CONSOLE: "Console",
};

export const REGION_LABELS: Record<Region, string> = {
  EUROPE: "Europe",
  AMERICAS: "Americas",
  ASIA: "Asia",
};

export const MAP_MODE_LABELS: Record<MapMode, string> = {
  CONTROL: "Control",
  ESCORT: "Escort",
  HYBRID: "Hybrid",
  PUSH: "Push",
  FLASHPOINT: "Flashpoint",
  CLASH: "Clash",
};

export function humanize(value: string): string {
  const words = value.toLowerCase().replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}
