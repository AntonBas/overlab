package gg.overlab.backend.feedback.dto;

import gg.overlab.backend.feedback.FeedbackStatus;
import gg.overlab.backend.feedback.FeedbackType;
import java.time.Instant;

public record FeedbackDto(
        FeedbackType type,
        String message,
        String pagePath,
        FeedbackStatus status,
        Instant createdAt) {
}
