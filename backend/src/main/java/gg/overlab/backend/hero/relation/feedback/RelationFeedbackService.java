package gg.overlab.backend.hero.relation.feedback;

import gg.overlab.backend.exception.core.BadRequestException;
import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.hero.relation.HeroRelation;
import gg.overlab.backend.common.UserScopedLock;
import gg.overlab.backend.hero.relation.HeroRelationRepository;
import gg.overlab.backend.hero.relation.RelationType;
import gg.overlab.backend.hero.relation.feedback.dto.RelationVoteDto;
import gg.overlab.backend.hero.relation.feedback.dto.RelationVoteRequest;
import gg.overlab.backend.hero.relation.feedback.dto.RelationVoteSummaryDto;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RelationFeedbackService {

    private static final String LOCK_SCOPE = "relation-votes";
    public static final int MAX_VOTES_PER_USER = 1000;
    public static final int MAX_SUMMARY_ROWS = 200;

    private final HeroRelationRepository relationRepository;
    private final RelationVoteRepository voteRepository;
    private final UserScopedLock userScopedLock;

    @Transactional(readOnly = true)
    public List<RelationVoteDto> votes(Long userId) {
        return voteRepository.findAllByUserIdOrderByIdAsc(userId).stream().map(this::toDto).toList();
    }

    @Transactional
    public void vote(Long userId, RelationVoteRequest request) {
        HeroRelation relation = requireRelation(request.heroSlug(), request.relatedHeroSlug(), request.type());
        userScopedLock.acquire(LOCK_SCOPE, userId);
        RelationVote vote = voteRepository.findByRelationIdAndUserId(relation.getId(), userId).orElse(null);
        if (vote == null) {
            if (voteRepository.countByUser(userId) >= MAX_VOTES_PER_USER) {
                throw new BadRequestException("You can keep at most " + MAX_VOTES_PER_USER + " votes");
            }
            vote = new RelationVote();
            vote.setRelation(relation);
            vote.setUserId(userId);
        }
        vote.setValue(request.value());
        voteRepository.save(vote);
    }

    @Transactional
    public void removeVote(Long userId, String heroSlug, String relatedHeroSlug, RelationType type) {
        HeroRelation relation = requireRelation(heroSlug, relatedHeroSlug, type);
        voteRepository.deleteByRelationIdAndUserId(relation.getId(), userId);
    }

    @Transactional(readOnly = true)
    public List<RelationVoteSummaryDto> voteSummary() {
        return voteRepository.summarize(PageRequest.of(0, MAX_SUMMARY_ROWS));
    }

    private HeroRelation requireRelation(String heroSlug, String relatedHeroSlug, RelationType type) {
        return relationRepository.findBetween(heroSlug, relatedHeroSlug, type)
                .orElseThrow(() -> new EntityNotFoundException("Hero relation", heroSlug + "/" + relatedHeroSlug));
    }

    private RelationVoteDto toDto(RelationVote vote) {
        HeroRelation relation = vote.getRelation();
        return new RelationVoteDto(relation.getHero().getSlug(), relation.getRelatedHero().getSlug(),
                relation.getType(), vote.getValue());
    }
}
