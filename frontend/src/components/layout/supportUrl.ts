const configuredUrl: string | undefined = import.meta.env.VITE_SUPPORT_URL;

export const supportUrl: string | undefined = configuredUrl?.startsWith(
  "https://",
)
  ? configuredUrl
  : undefined;
