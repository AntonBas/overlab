const WEEKDAYS: Record<string, string> = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
  SUN: "Sunday",
};

const WEEKDAY_BY_NUMBER = [
  "SUN",
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
  "SUN",
];

const NUMBER = /^\d{1,2}$/;

function pad(value: string): string {
  return value.padStart(2, "0");
}

function weekdayName(field: string): string | null {
  const upper = field.toUpperCase();
  if (WEEKDAYS[upper]) {
    return WEEKDAYS[upper];
  }
  if (NUMBER.test(field)) {
    return WEEKDAYS[WEEKDAY_BY_NUMBER[Number(field)]] ?? null;
  }
  return null;
}

export function describeCron(cron: string): string | null {
  const parts = cron.trim().split(/\s+/);
  const fields = parts.length === 5 ? ["0", ...parts] : parts;
  if (fields.length !== 6) {
    return null;
  }
  const [seconds, minutes, hours, dayOfMonth, month, dayOfWeek] = fields;
  const isDailyShape =
    seconds === "0" &&
    NUMBER.test(minutes) &&
    NUMBER.test(hours) &&
    (dayOfMonth === "*" || dayOfMonth === "?") &&
    month === "*";
  if (!isDailyShape) {
    return null;
  }
  const time = `${pad(hours)}:${pad(minutes)}`;
  if (dayOfWeek === "*" || dayOfWeek === "?") {
    return `Every day at ${time}`;
  }
  const weekday = weekdayName(dayOfWeek);
  return weekday ? `Every ${weekday} at ${time}` : null;
}

export function describeInterval(duration: string): string {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(duration);
  if (!match) {
    return duration;
  }
  const totalHours =
    Number(match[1] ?? 0) +
    Number(match[2] ?? 0) / 60 +
    Number(match[3] ?? 0) / 3600;
  if (totalHours >= 24 && totalHours % 24 === 0) {
    const days = totalHours / 24;
    return days === 1 ? "day" : `${days} days`;
  }
  return totalHours === 1 ? "hour" : `${totalHours} hours`;
}
