import { useEffect } from "react";
import { getConsent } from "../consent/consentStore";
import { isExcludedFromAnalytics } from "../consent/analyticsExclusion";
import { useConsent } from "../consent/useConsent";

const UMAMI_SCRIPT_URL = "https://cloud.umami.is/script.js";
const UMAMI_WEBSITE_ID = "fdfd56e6-91f6-46d9-b7e6-a1e8a87dce8f";
const ANALYTICS_DOMAIN = "overlabgg.com";
const BEFORE_SEND_HANDLER = "overlabBeforeAnalyticsSend";

interface AnalyticsPayload {
  url?: string;
}

declare global {
  interface Window {
    overlabBeforeAnalyticsSend?: (
      type: string,
      payload: AnalyticsPayload,
    ) => AnalyticsPayload | null;
  }
}

export function AnalyticsLoader() {
  const consent = useConsent();

  useEffect(() => {
    if (!consent.analytics) {
      return;
    }
    window.overlabBeforeAnalyticsSend = (_type, payload) =>
      getConsent().analytics && !isExcludedFromAnalytics(payload.url)
        ? payload
        : null;
    const script = document.createElement("script");
    script.defer = true;
    script.src = UMAMI_SCRIPT_URL;
    script.dataset.websiteId = UMAMI_WEBSITE_ID;
    script.dataset.domains = ANALYTICS_DOMAIN;
    script.dataset.doNotTrack = "true";
    script.dataset.beforeSend = BEFORE_SEND_HANDLER;
    document.head.appendChild(script);
    return () => {
      script.remove();
      window.overlabBeforeAnalyticsSend = () => null;
    };
  }, [consent.analytics]);

  return null;
}
