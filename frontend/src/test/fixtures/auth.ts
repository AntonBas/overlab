import type { User } from "../../types/user";

export function user(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    email: "ana@overlab.gg",
    displayName: "Ana",
    role: "USER",
    provider: "LOCAL",
    emailVerified: true,
    ...overrides,
  };
}
