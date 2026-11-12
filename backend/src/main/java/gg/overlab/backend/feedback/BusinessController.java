package gg.overlab.backend.feedback;

import gg.overlab.backend.config.security.AuthenticatedUser;
import gg.overlab.backend.feedback.dto.BusinessMessageRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Feedback")
@RestController
@RequestMapping("/api/business")
@RequiredArgsConstructor
public class BusinessController {

    private final FeedbackService feedbackService;

    @Operation(summary = "Send a sponsorship, advertising or partnership message (login is optional)")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void submit(@AuthenticationPrincipal AuthenticatedUser user,
                       @Valid @RequestBody BusinessMessageRequest request) {
        feedbackService.submitBusiness(user == null ? null : user.id(), request);
    }
}
