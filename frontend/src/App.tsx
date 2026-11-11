import { BrowserRouter } from "react-router-dom";
import { ToastProvider } from "./components/toast/ToastProvider";
import { AuthProvider } from "./features/auth/context/AuthProvider";
import { ControlSchemeProvider } from "./features/heroes/context/ControlSchemeProvider";
import { AbilitiesProvider } from "./features/heroes/context/AbilitiesProvider";
import { PersonalDataProvider } from "./features/personal/context/PersonalDataProvider";
import { CoverageProvider } from "./features/stats/context/CoverageProvider";
import { RegionProvider } from "./features/stats/context/RegionProvider";
import { AppRoutes } from "./routes/AppRoutes";

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <PersonalDataProvider>
            <RegionProvider>
              <CoverageProvider>
                <ControlSchemeProvider>
                  <AbilitiesProvider>
                    <AppRoutes />
                  </AbilitiesProvider>
                </ControlSchemeProvider>
              </CoverageProvider>
            </RegionProvider>
          </PersonalDataProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
