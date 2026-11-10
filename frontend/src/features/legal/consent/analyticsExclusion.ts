const EXCLUDED_PATH_PREFIX = "/admin";

export function isExcludedFromAnalytics(url: string | undefined): boolean {
  if (!url) {
    return false;
  }
  const { pathname } = new URL(url, window.location.origin);
  return (
    pathname === EXCLUDED_PATH_PREFIX ||
    pathname.startsWith(`${EXCLUDED_PATH_PREFIX}/`)
  );
}
