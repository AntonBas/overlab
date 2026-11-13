import { api } from "../../../../services/api";
import type { FeedbackMessage, FeedbackStatus } from "../types";

export async function fetchFeedback(
  status: FeedbackStatus,
): Promise<FeedbackMessage[]> {
  const { data } = await api.get<FeedbackMessage[]>("/admin/feedback", {
    params: { status },
  });
  return data;
}

export async function changeFeedbackStatus(
  id: number,
  status: FeedbackStatus,
): Promise<void> {
  await api.put(`/admin/feedback/${id}/status`, { status });
}
