package gg.overlab.backend.hero.relation.feedback;

import gg.overlab.backend.hero.relation.feedback.dto.RelationReportAdminDto;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RelationReportRepository extends JpaRepository<RelationReport, Long> {

    boolean existsByRelationIdAndUserIdAndStatus(Long relationId, Long userId, RelationReportStatus status);

    long countByUserIdAndStatus(Long userId, RelationReportStatus status);

    @EntityGraph(attributePaths = {"relation", "relation.hero", "relation.relatedHero"})
    List<RelationReport> findAllByUserIdOrderByIdAsc(Long userId);

    @Query("""
            select new gg.overlab.backend.hero.relation.feedback.dto.RelationReportAdminDto(
                report.id, r.id, h.slug, rh.slug, r.type, r.note, report.message, u.displayName,
                report.status, report.createdAt, report.resolvedAt)
            from RelationReport report
            join report.relation r
            join r.hero h
            join r.relatedHero rh
            join gg.overlab.backend.user.User u on u.id = report.userId
            where report.status = :status
            order by report.createdAt desc
            """)
    List<RelationReportAdminDto> findForAdmin(@Param("status") RelationReportStatus status);
}
