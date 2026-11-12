import { createContext } from "react";
import type { User } from "../../../types/user";

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
  replaceUser: (user: User | null) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
