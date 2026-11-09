import { api } from "../../../services/api";

export type FeedbackType = "INACCURACY" | "BUG" | "TYPO" | "OTHER";

export interface FeedbackPayload {
  type: FeedbackType;
  message: string;
  pagePath: string | null;
}

export async function sendFeedback(payload: FeedbackPayload): Promise<void> {
  await api.post("/feedback", payload);
}
