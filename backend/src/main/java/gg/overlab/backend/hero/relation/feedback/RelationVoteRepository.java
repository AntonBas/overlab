package gg.overlab.backend.hero.relation.feedback;

import gg.overlab.backend.hero.relation.feedback.dto.RelationVoteSummaryDto;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RelationVoteRepository extends JpaRepository<RelationVote, Long> {

    Optional<RelationVote> findByRelationIdAndUserId(Long relationId, Long userId);

    @EntityGraph(attributePaths = {"relation", "relation.hero", "relation.relatedHero"})
    List<RelationVote> findAllByUserIdOrderByIdAsc(Long userId);

    void deleteByRelationIdAndUserId(Long relationId, Long userId);

    @Query("""
            select new gg.overlab.backend.hero.relation.feedback.dto.RelationVoteSummaryDto(
                r.id, h.slug, rh.slug, r.type,
                count(case when v.value = gg.overlab.backend.hero.relation.feedback.RelationVoteValue.UP then 1 end),
                count(case when v.value = gg.overlab.backend.hero.relation.feedback.RelationVoteValue.DOWN then 1 end))
            from RelationVote v
            join v.relation r
            join r.hero h
            join r.relatedHero rh
            group by r.id, h.slug, rh.slug, r.type
            order by count(case when v.value = gg.overlab.backend.hero.relation.feedback.RelationVoteValue.DOWN then 1 end) desc, r.id
            """)
    List<RelationVoteSummaryDto> summarize(Pageable pageable);

    @Query("select count(v) from RelationVote v where v.userId = :userId")
    long countByUser(@Param("userId") Long userId);
}
