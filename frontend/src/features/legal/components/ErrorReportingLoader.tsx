import { useEffect } from "react";
import { startErrorReporting, stopErrorReporting } from "../../../sentry";
import { useConsent } from "../consent/useConsent";

export function ErrorReportingLoader() {
  const consent = useConsent();

  useEffect(() => {
    if (!consent.analytics) {
      return;
    }
    void startErrorReporting();
    return () => {
      void stopErrorReporting();
    };
  }, [consent.analytics]);

  return null;
}
