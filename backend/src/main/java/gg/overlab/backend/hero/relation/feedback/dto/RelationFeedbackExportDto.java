package gg.overlab.backend.hero.relation.feedback.dto;

import java.util.List;

public record RelationFeedbackExportDto(List<RelationVoteDto> votes, List<RelationReportDto> reports) {
}
