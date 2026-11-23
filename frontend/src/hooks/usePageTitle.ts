import { useEffect } from "react";

const SITE_NAME = "Overlab";

export function usePageTitle(title: string | null | undefined) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    const openGraphTitle = document.head.querySelector(
      'meta[property="og:title"]',
    );
    const twitterTitle = document.head.querySelector(
      'meta[name="twitter:title"]',
    );
    document.title = fullTitle;
    openGraphTitle?.setAttribute("content", fullTitle);
    twitterTitle?.setAttribute("content", fullTitle);
  }, [title]);
}
