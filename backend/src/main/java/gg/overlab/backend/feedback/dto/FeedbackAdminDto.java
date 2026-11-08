package gg.overlab.backend.feedback.dto;

import gg.overlab.backend.feedback.FeedbackStatus;
import gg.overlab.backend.feedback.FeedbackType;
import java.time.Instant;

public record FeedbackAdminDto(
        Long id,
        FeedbackType type,
        String message,
        String pagePath,
        String authorName,
        String contactEmail,
        FeedbackStatus status,
        Instant createdAt,
        Instant resolvedAt) {
}
