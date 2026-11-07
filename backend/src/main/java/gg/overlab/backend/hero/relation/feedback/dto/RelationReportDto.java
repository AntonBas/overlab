package gg.overlab.backend.hero.relation.feedback.dto;

import gg.overlab.backend.hero.relation.RelationType;
import gg.overlab.backend.hero.relation.feedback.RelationReportStatus;
import java.time.Instant;

public record RelationReportDto(
        String heroSlug,
        String relatedHeroSlug,
        RelationType type,
        String message,
        RelationReportStatus status,
        Instant createdAt) {
}
