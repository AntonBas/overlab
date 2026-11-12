package gg.overlab.backend.feedback;

import gg.overlab.backend.feedback.dto.FeedbackAdminDto;
import gg.overlab.backend.feedback.dto.FeedbackStatusRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Feedback")
@RestController
@RequestMapping("/api/admin/feedback")
@RequiredArgsConstructor
public class FeedbackAdminController {

    private final FeedbackService feedbackService;

    @Operation(summary = "Feedback messages, newest first")
    @GetMapping
    public List<FeedbackAdminDto> findForAdmin(@RequestParam(defaultValue = "NEW") FeedbackStatus status) {
        return feedbackService.findForAdmin(status);
    }

    @Operation(summary = "Mark a feedback message as resolved, dismissed or new")
    @PutMapping("/{id}/status")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changeStatus(@PathVariable Long id, @Valid @RequestBody FeedbackStatusRequest request) {
        feedbackService.changeStatus(id, request.status());
    }
}
