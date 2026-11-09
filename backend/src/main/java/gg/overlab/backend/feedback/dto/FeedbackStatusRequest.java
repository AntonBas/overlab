package gg.overlab.backend.feedback.dto;

import gg.overlab.backend.feedback.FeedbackStatus;
import jakarta.validation.constraints.NotNull;

public record FeedbackStatusRequest(@NotNull FeedbackStatus status) {
}
