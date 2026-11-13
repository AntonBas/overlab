export type FeedbackType = "INACCURACY" | "BUG" | "TYPO" | "OTHER" | "BUSINESS";

export type FeedbackStatus = "NEW" | "RESOLVED" | "DISMISSED";

export interface FeedbackMessage {
  id: number;
  type: FeedbackType;
  message: string;
  pagePath: string | null;
  authorName: string | null;
  contactEmail: string | null;
  status: FeedbackStatus;
  createdAt: string;
  resolvedAt: string | null;
}
