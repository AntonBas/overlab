import type { ReactNode } from "react";
import { ToastProvider } from "../components/toast/ToastProvider";
import { AuthProvider } from "../features/auth";
import {
  AbilitiesProvider,
  ControlSchemeProvider,
} from "../features/abilities";
import { PersonalDataProvider } from "../features/personal";
import { CoverageProvider, RegionProvider } from "../features/stats";

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
