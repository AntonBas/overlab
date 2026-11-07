package gg.overlab.backend.hero.relation.feedback.dto;

import gg.overlab.backend.hero.relation.RelationType;
import gg.overlab.backend.hero.relation.feedback.RelationReportStatus;
import java.time.Instant;

public record RelationReportAdminDto(
        Long id,
        Long relationId,
        String heroSlug,
        String relatedHeroSlug,
        RelationType type,
        String relationNote,
        String message,
        String reporterName,
        RelationReportStatus status,
        Instant createdAt,
        Instant resolvedAt) {
}
