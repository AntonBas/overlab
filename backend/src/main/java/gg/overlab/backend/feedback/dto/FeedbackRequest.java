package gg.overlab.backend.feedback.dto;

import gg.overlab.backend.feedback.FeedbackType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record FeedbackRequest(
        @NotNull FeedbackType type,
        @NotBlank @Size(min = 10, max = 2000) String message,
        @Size(max = 255) String pagePath) {
}
