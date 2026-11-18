const RELOAD_KEY = "overlab:stale-build-reload";
const RELOAD_COOLDOWN_MS = 10_000;

const CHUNK_ERROR =
  /dynamically imported module|importing a module script failed|ChunkLoadError|Unable to preload CSS/i;

export function isChunkLoadError(error: unknown): boolean {
  return error instanceof Error && CHUNK_ERROR.test(error.message);
}

export function reloadForNewBuild(
  reload: () => void = () => window.location.reload(),
): boolean {
  try {
    const last = Number(window.sessionStorage.getItem(RELOAD_KEY));
    if (Date.now() - last < RELOAD_COOLDOWN_MS) {
      return false;
    }
    window.sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    return false;
  }
  reload();
  return true;
}
