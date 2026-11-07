package gg.overlab.backend.hero.relation.feedback.dto;

import gg.overlab.backend.hero.relation.feedback.RelationReportStatus;
import jakarta.validation.constraints.NotNull;

public record RelationReportStatusRequest(@NotNull RelationReportStatus status) {
}
