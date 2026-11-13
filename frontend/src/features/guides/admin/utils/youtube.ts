const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

export function parseYoutubeId(input: string): string | null {
  const value = input.trim();
  if (VIDEO_ID.test(value)) {
    return value;
  }
  let url: URL;
  try {
    url = new URL(value.includes("://") ? value : `https://${value}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\.|^m\./, "");
  let candidate: string | null | undefined = null;
  if (host === "youtu.be") {
    candidate = url.pathname.split("/")[1];
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const [, kind, id] = url.pathname.split("/");
    candidate =
      kind === "embed" || kind === "shorts" || kind === "live"
        ? id
        : url.searchParams.get("v");
  }
  return candidate && VIDEO_ID.test(candidate) ? candidate : null;
}

export function parseTimestamp(input: string): number | null {
  const value = input.trim();
  if (value === "") {
    return 0;
  }
  if (/^\d+$/.test(value)) {
    return Number(value);
  }
  const parts = value.split(":");
  if (parts.length > 3 || !parts.every((part) => /^\d{1,2}$/.test(part))) {
    return null;
  }
  const numbers = parts.map(Number);
  if (numbers.slice(1).some((part) => part > 59)) {
    return null;
  }
  return numbers.reduce((total, part) => total * 60 + part, 0);
}

export function formatTimestamp(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const padded = String(seconds).padStart(2, "0");
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${padded}`;
  }
  return `${minutes}:${padded}`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
