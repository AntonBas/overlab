package gg.overlab.backend.feedback;

import gg.overlab.backend.config.security.AuthenticatedUser;
import gg.overlab.backend.feedback.dto.FeedbackRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Feedback")
@RestController
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;

    @Operation(summary = "Send a message about an inaccuracy, bug or typo (login is optional)")
    @PostMapping("/api/feedback")
    @ResponseStatus(HttpStatus.CREATED)
    public void submit(@AuthenticationPrincipal AuthenticatedUser user, @Valid @RequestBody FeedbackRequest request) {
        feedbackService.submit(user == null ? null : user.id(), request);
    }
}
