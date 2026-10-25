import { useEffect } from "react";

const SITE_NAME = "Overlab";

export function usePageTitle(title: string | null | undefined) {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  }, [title]);
}
