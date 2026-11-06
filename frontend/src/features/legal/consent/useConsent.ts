import { useSyncExternalStore } from "react";
import { getConsent, subscribeToConsent } from "./consentStore";

export function useConsent() {
  return useSyncExternalStore(subscribeToConsent, getConsent);
}
