package gg.overlab.backend.hero.relation.feedback;

import gg.overlab.backend.hero.relation.feedback.dto.RelationVoteSummaryDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Relation feedback")
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class RelationFeedbackAdminController {

    private final RelationFeedbackService feedbackService;

    @Operation(summary = "Votes per counter or synergy, most disagreed first")
    @GetMapping("/relation-votes/summary")
    public List<RelationVoteSummaryDto> voteSummary() {
        return feedbackService.voteSummary();
    }
}
