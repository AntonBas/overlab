package gg.overlab.backend.hero.relation.feedback;

import gg.overlab.backend.exception.core.BadRequestException;
import gg.overlab.backend.exception.core.ConflictException;
import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.hero.relation.HeroRelation;
import gg.overlab.backend.hero.relation.HeroRelationRepository;
import gg.overlab.backend.hero.relation.RelationType;
import gg.overlab.backend.hero.relation.feedback.dto.RelationFeedbackExportDto;
import gg.overlab.backend.hero.relation.feedback.dto.RelationReportAdminDto;
import gg.overlab.backend.hero.relation.feedback.dto.RelationReportDto;
import gg.overlab.backend.hero.relation.feedback.dto.RelationReportRequest;
import gg.overlab.backend.hero.relation.feedback.dto.RelationVoteDto;
import gg.overlab.backend.hero.relation.feedback.dto.RelationVoteRequest;
import gg.overlab.backend.hero.relation.feedback.dto.RelationVoteSummaryDto;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RelationFeedbackService {

    public static final int MAX_OPEN_REPORTS_PER_USER = 10;
    public static final int MAX_VOTES_PER_USER = 1000;
    public static final int MAX_SUMMARY_ROWS = 200;

    private final HeroRelationRepository relationRepository;
    private final RelationVoteRepository voteRepository;
    private final RelationReportRepository reportRepository;

    @Transactional(readOnly = true)
    public List<RelationVoteDto> votes(Long userId) {
        return voteRepository.findAllByUserIdOrderByIdAsc(userId).stream().map(this::toDto).toList();
    }

    @Transactional
    public void vote(Long userId, RelationVoteRequest request) {
        HeroRelation relation = requireRelation(request.heroSlug(), request.relatedHeroSlug(), request.type());
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

    @Transactional
    public void report(Long userId, RelationReportRequest request) {
        HeroRelation relation = requireRelation(request.heroSlug(), request.relatedHeroSlug(), request.type());
        if (reportRepository.existsByRelationIdAndUserIdAndStatus(relation.getId(), userId,
                RelationReportStatus.NEW)) {
            throw new ConflictException("You already have an open report for this recommendation");
        }
        if (reportRepository.countByUserIdAndStatus(userId, RelationReportStatus.NEW) >= MAX_OPEN_REPORTS_PER_USER) {
            throw new BadRequestException("You can have at most " + MAX_OPEN_REPORTS_PER_USER
                    + " open reports, wait until some are reviewed");
        }
        RelationReport report = new RelationReport();
        report.setRelation(relation);
        report.setUserId(userId);
        report.setMessage(request.message().trim());
        reportRepository.save(report);
    }

    @Transactional(readOnly = true)
    public RelationFeedbackExportDto export(Long userId) {
        List<RelationReportDto> reports = reportRepository.findAllByUserIdOrderByIdAsc(userId).stream()
                .map(report -> new RelationReportDto(report.getRelation().getHero().getSlug(),
                        report.getRelation().getRelatedHero().getSlug(), report.getRelation().getType(),
                        report.getMessage(), report.getStatus(), report.getCreatedAt()))
                .toList();
        return new RelationFeedbackExportDto(votes(userId), reports);
    }

    @Transactional(readOnly = true)
    public List<RelationReportAdminDto> reports(RelationReportStatus status) {
        return reportRepository.findForAdmin(status);
    }

    @Transactional(readOnly = true)
    public List<RelationVoteSummaryDto> voteSummary() {
        return voteRepository.summarize(PageRequest.of(0, MAX_SUMMARY_ROWS));
    }

    @Transactional
    public void changeStatus(Long reportId, RelationReportStatus status) {
        RelationReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new EntityNotFoundException("Relation report", reportId));
        report.setStatus(status);
        report.setResolvedAt(status == RelationReportStatus.NEW ? null : Instant.now());
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
