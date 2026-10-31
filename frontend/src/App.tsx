import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./features/auth/context/AuthProvider";
import { AbilitiesProvider } from "./features/heroes/context/AbilitiesProvider";
import { PersonalDataProvider } from "./features/personal/context/PersonalDataProvider";
import { AppRoutes } from "./routes/AppRoutes";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PersonalDataProvider>
          <AbilitiesProvider>
            <AppRoutes />
          </AbilitiesProvider>
        </PersonalDataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
