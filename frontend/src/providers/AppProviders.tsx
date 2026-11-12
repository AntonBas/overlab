import type { ReactNode } from "react";
import { ToastProvider } from "../components/toast/ToastProvider";
import { AuthProvider } from "../features/auth/context/AuthProvider";
import { AbilitiesProvider } from "../features/heroes/context/AbilitiesProvider";
import { ControlSchemeProvider } from "../features/heroes/context/ControlSchemeProvider";
import { PersonalDataProvider } from "../features/personal/context/PersonalDataProvider";
import { CoverageProvider } from "../features/stats/context/CoverageProvider";
import { RegionProvider } from "../features/stats/context/RegionProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <PersonalDataProvider>
          <RegionProvider>
            <CoverageProvider>
              <ControlSchemeProvider>
                <AbilitiesProvider>{children}</AbilitiesProvider>
              </ControlSchemeProvider>
            </CoverageProvider>
          </RegionProvider>
        </PersonalDataProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
