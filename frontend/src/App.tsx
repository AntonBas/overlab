import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./features/auth/context/AuthProvider";
import { PersonalDataProvider } from "./features/personal/context/PersonalDataProvider";
import { AppRoutes } from "./routes/AppRoutes";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PersonalDataProvider>
          <AppRoutes />
        </PersonalDataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
