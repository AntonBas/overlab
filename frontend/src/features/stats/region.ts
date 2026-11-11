import type { Region } from "../../types/api";

const STORAGE_KEY = "overlab.region";

const MIDDLE_EAST_AND_RUSSIA_ZONES = new Set([
  "Asia/Aden",
  "Asia/Amman",
  "Asia/Baghdad",
  "Asia/Bahrain",
  "Asia/Baku",
  "Asia/Beirut",
  "Asia/Damascus",
  "Asia/Dubai",
  "Asia/Gaza",
  "Asia/Hebron",
  "Asia/Irkutsk",
  "Asia/Istanbul",
  "Asia/Jerusalem",
  "Asia/Kamchatka",
  "Asia/Krasnoyarsk",
  "Asia/Kuwait",
  "Asia/Magadan",
  "Asia/Muscat",
  "Asia/Nicosia",
  "Asia/Novosibirsk",
  "Asia/Omsk",
  "Asia/Qatar",
  "Asia/Riyadh",
  "Asia/Tbilisi",
  "Asia/Tehran",
  "Asia/Tel_Aviv",
  "Asia/Vladivostok",
  "Asia/Yakutsk",
  "Asia/Yekaterinburg",
  "Asia/Yerevan",
]);

const AMERICAS_PREFIXES = [
  "America/",
  "US/",
  "Canada/",
  "Mexico/",
  "Brazil/",
  "Chile/",
  "Cuba",
  "Australia/",
  "Pacific/",
];

const ASIA_ZONES_OUTSIDE_ASIA_PREFIX = new Set([
  "Pacific/Guam",
  "Pacific/Saipan",
]);

export function regionForTimeZone(timeZone: string | null | undefined): Region {
  if (!timeZone) {
    return "EUROPE";
  }
  if (ASIA_ZONES_OUTSIDE_ASIA_PREFIX.has(timeZone)) {
    return "ASIA";
  }
  if (timeZone.startsWith("Asia/")) {
    return MIDDLE_EAST_AND_RUSSIA_ZONES.has(timeZone) ? "EUROPE" : "ASIA";
  }
  if (AMERICAS_PREFIXES.some((prefix) => timeZone.startsWith(prefix))) {
    return "AMERICAS";
  }
  return "EUROPE";
}

export function detectRegion(): Region {
  try {
    return regionForTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  } catch {
    return "EUROPE";
  }
}

export function readStoredRegion(): Region | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "EUROPE" || stored === "AMERICAS" || stored === "ASIA"
      ? stored
      : null;
  } catch {
    return null;
  }
}

export function writeStoredRegion(region: Region): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, region);
  } catch {
    return;
  }
}
