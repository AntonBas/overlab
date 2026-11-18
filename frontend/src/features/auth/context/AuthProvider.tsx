import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { remainingSpinnerTime } from "../../../components/ui/spinnerTiming";
import type { User } from "../../../types/user";
import * as authApi from "../api/authApi";
import { AuthContext } from "./authContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let holdTimer: number | undefined;
    const startedAt = Date.now();
    authApi
      .fetchCurrentUser()
      .then((current) => {
        if (!cancelled) {
          setUser(current);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          holdTimer = window.setTimeout(
            () => setLoading(false),
            remainingSpinnerTime(Date.now() - startedAt),
          );
        }
      });
    return () => {
      cancelled = true;
      window.clearTimeout(holdTimer);
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const signedIn = await authApi.login(email, password);
    setUser(signedIn);
    return signedIn;
  }, []);

  const signOut = useCallback(async () => {
    await authApi.logout().catch(() => undefined);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, signIn, signOut, replaceUser: setUser }),
    [user, loading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
