import { api } from "../../../services/api";

export interface BusinessMessagePayload {
  name: string;
  email: string;
  message: string;
}

export async function sendBusinessMessage(
  payload: BusinessMessagePayload,
): Promise<void> {
  await api.post("/business", payload);
}
