package gg.overlab.backend.hero.relation.feedback;

import gg.overlab.backend.hero.relation.feedback.dto.RelationReportAdminDto;
import gg.overlab.backend.hero.relation.feedback.dto.RelationReportStatusRequest;
import gg.overlab.backend.hero.relation.feedback.dto.RelationVoteSummaryDto;
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

@Tag(name = "Relation feedback")
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class RelationFeedbackAdminController {

    private final RelationFeedbackService feedbackService;

    @Operation(summary = "Reports about counters and synergies, newest first")
    @GetMapping("/relation-reports")
    public List<RelationReportAdminDto> reports(
            @RequestParam(defaultValue = "NEW") RelationReportStatus status) {
        return feedbackService.reports(status);
    }

    @Operation(summary = "Accept, reject or reopen a report")
    @PutMapping("/relation-reports/{id}/status")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changeStatus(@PathVariable Long id, @Valid @RequestBody RelationReportStatusRequest request) {
        feedbackService.changeStatus(id, request.status());
    }

    @Operation(summary = "Votes per counter or synergy, most disagreed first")
    @GetMapping("/relation-votes/summary")
    public List<RelationVoteSummaryDto> voteSummary() {
        return feedbackService.voteSummary();
    }
}
