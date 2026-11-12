import { api } from "../../../services/api";
import type { User } from "../../../types/user";

export async function updateProfile(displayName: string): Promise<User> {
  const { data } = await api.put<User>("/me/profile", { displayName });
  return data;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<User> {
  const { data } = await api.post<User>("/me/password", {
    currentPassword,
    newPassword,
  });
  return data;
}

export async function requestEmailChange(
  newEmail: string,
  currentPassword: string,
): Promise<void> {
  await api.post("/me/email", { newEmail, currentPassword });
}

export async function exportAccount(): Promise<Blob> {
  const { data } = await api.get<Blob>("/me/export", { responseType: "blob" });
  return data;
}

export async function deleteAccount(password: string | null): Promise<void> {
  await api.delete("/me", { data: { password } });
}
