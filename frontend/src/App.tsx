import { BrowserRouter } from "react-router-dom";
import { ToastProvider } from "./components/toast/ToastProvider";
import { AuthProvider } from "./features/auth/context/AuthProvider";
import { ControlSchemeProvider } from "./features/heroes/context/ControlSchemeProvider";
import { AbilitiesProvider } from "./features/heroes/context/AbilitiesProvider";
import { PersonalDataProvider } from "./features/personal/context/PersonalDataProvider";
import { AppRoutes } from "./routes/AppRoutes";

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <PersonalDataProvider>
            <ControlSchemeProvider>
              <AbilitiesProvider>
                <AppRoutes />
              </AbilitiesProvider>
            </ControlSchemeProvider>
          </PersonalDataProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
