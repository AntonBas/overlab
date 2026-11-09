import { useEffect } from "react";
import { useConsent } from "../consent/useConsent";

const UMAMI_SCRIPT_URL = "https://cloud.umami.is/script.js";
const UMAMI_WEBSITE_ID = "fdfd56e6-91f6-46d9-b7e6-a1e8a87dce8f";
const ANALYTICS_DOMAIN = "overlabgg.com";

export function AnalyticsLoader() {
  const consent = useConsent();

  useEffect(() => {
    if (!consent.analytics) {
      return;
    }
    const script = document.createElement("script");
    script.defer = true;
    script.src = UMAMI_SCRIPT_URL;
    script.dataset.websiteId = UMAMI_WEBSITE_ID;
    script.dataset.domains = ANALYTICS_DOMAIN;
    script.dataset.doNotTrack = "true";
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, [consent.analytics]);

  return null;
}
