package gg.overlab.backend.hero.relation.feedback;

import gg.overlab.backend.config.security.AuthenticatedUser;
import gg.overlab.backend.hero.relation.RelationType;
import gg.overlab.backend.hero.relation.feedback.dto.RelationVoteDto;
import gg.overlab.backend.hero.relation.feedback.dto.RelationVoteRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Relation feedback")
@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
public class RelationFeedbackController {

    private final RelationFeedbackService feedbackService;

    @Operation(summary = "Votes of the current user on counters and synergies")
    @GetMapping("/relation-votes")
    public List<RelationVoteDto> votes(@AuthenticationPrincipal AuthenticatedUser user) {
        return feedbackService.votes(user.id());
    }

    @Operation(summary = "Agree or disagree with a counter or synergy")
    @PutMapping("/relation-votes")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void vote(@AuthenticationPrincipal AuthenticatedUser user, @Valid @RequestBody RelationVoteRequest request) {
        feedbackService.vote(user.id(), request);
    }

    @Operation(summary = "Withdraw a vote")
    @DeleteMapping("/relation-votes")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeVote(@AuthenticationPrincipal AuthenticatedUser user, @RequestParam String heroSlug,
                           @RequestParam String relatedHeroSlug, @RequestParam RelationType type) {
        feedbackService.removeVote(user.id(), heroSlug, relatedHeroSlug, type);
    }
}
