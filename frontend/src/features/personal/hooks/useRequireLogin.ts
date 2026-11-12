import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth";

export function useRequireLogin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function sendToLogin() {
    navigate("/login", { state: { from: location.pathname } });
  }

  return { signedIn: user !== null, sendToLogin };
}
