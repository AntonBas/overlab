package gg.overlab.backend.integration;

import static org.assertj.core.api.Assertions.assertThat;

import gg.overlab.backend.audit.AuditAction;
import gg.overlab.backend.audit.AuditLog;
import gg.overlab.backend.audit.AuditLogRepository;
import gg.overlab.backend.audit.AuditRetentionJob;
import gg.overlab.backend.collector.run.CollectorRun;
import gg.overlab.backend.collector.run.CollectorRunRepository;
import gg.overlab.backend.collector.run.CollectorRunRetentionJob;
import gg.overlab.backend.collector.run.CollectorRunStatus;
import gg.overlab.backend.collector.run.CollectorTrigger;
import gg.overlab.backend.feedback.FeedbackRetentionJob;
import gg.overlab.backend.feedback.FeedbackStatus;
import gg.overlab.backend.feedback.FeedbackType;
import gg.overlab.backend.feedback.SiteFeedback;
import gg.overlab.backend.feedback.SiteFeedbackRepository;
import gg.overlab.backend.user.User;
import gg.overlab.backend.user.UserRepository;
import gg.overlab.backend.user.token.UserToken;
import gg.overlab.backend.user.token.UserTokenRepository;
import gg.overlab.backend.user.token.UserTokenService;
import gg.overlab.backend.user.token.UserTokenType;
import java.time.Duration;
import jakarta.persistence.EntityManager;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@Transactional
class RetentionJobsIntegrationTest {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private AuditRetentionJob auditRetentionJob;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private CollectorRunRepository runRepository;

    @Autowired
    private CollectorRunRetentionJob runRetentionJob;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserTokenRepository tokenRepository;

    @Autowired
    private UserTokenService tokenService;

    @Autowired
    private SiteFeedbackRepository feedbackRepository;

    @Autowired
    private FeedbackRetentionJob feedbackRetentionJob;

    private User user(String email) {
        User user = new User();
        user.setEmail(email);
        user.setDisplayName("Retention");
        return userRepository.saveAndFlush(user);
    }

    private UserToken token(User owner, String hash, Instant expiresAt) {
        UserToken token = new UserToken();
        token.setUser(owner);
        token.setType(UserTokenType.REFRESH);
        token.setTokenHash(hash);
        token.setExpiresAt(expiresAt);
        return tokenRepository.saveAndFlush(token);
    }

    private SiteFeedback feedback(FeedbackStatus status, Instant resolvedAt) {
        SiteFeedback feedback = new SiteFeedback();
        feedback.setType(FeedbackType.OTHER);
        feedback.setMessage("Retention check message");
        feedback.setStatus(status);
        feedback.setResolvedAt(resolvedAt);
        return feedbackRepository.saveAndFlush(feedback);
    }

    private AuditLog auditEntry(Instant occurredAt) {
        AuditLog entry = new AuditLog();
        entry.setOccurredAt(occurredAt);
        entry.setAction(AuditAction.UPDATE);
        entry.setEntityType("Hero");
        entry.setIpAddress("203.0.113.7");
        return auditLogRepository.saveAndFlush(entry);
    }

    private CollectorRun run(Instant startedAt, CollectorRunStatus status) {
        CollectorRun run = new CollectorRun();
        run.setJobName("retention-test");
        run.setTrigger(CollectorTrigger.MANUAL);
        run.setStatus(status);
        run.setStartedAt(startedAt);
        return runRepository.saveAndFlush(run);
    }

    @Test
    void oldAuditEntriesLoseTheirIpAddressButStayReadable() {
        AuditLog old = auditEntry(Instant.now().minus(Duration.ofDays(200)));
        AuditLog recent = auditEntry(Instant.now().minus(Duration.ofDays(1)));

        auditRetentionJob.deleteOldUserEvents();
        entityManager.clear();

        assertThat(auditLogRepository.findById(old.getId())).hasValueSatisfying(
                entry -> assertThat(entry.getIpAddress()).isNull());
        assertThat(auditLogRepository.findById(recent.getId())).hasValueSatisfying(
                entry -> assertThat(entry.getIpAddress()).isEqualTo("203.0.113.7"));
    }

    @Test
    void oldFinishedCollectorRunsAreDeletedButRunningOnesAreKept() {
        Instant longAgo = Instant.now().minus(Duration.ofDays(200));
        CollectorRun oldFinished = run(longAgo, CollectorRunStatus.SUCCESS);
        CollectorRun oldRunning = run(longAgo, CollectorRunStatus.RUNNING);
        CollectorRun recent = run(Instant.now(), CollectorRunStatus.SUCCESS);

        int deleted = runRetentionJob.deleteOldRuns();
        entityManager.clear();

        assertThat(deleted).isGreaterThanOrEqualTo(1);
        assertThat(runRepository.findById(oldFinished.getId())).isEmpty();
        assertThat(runRepository.findById(oldRunning.getId())).isPresent();
        assertThat(runRepository.findById(recent.getId())).isPresent();
    }

    @Test
    void expiredTokensAreDeletedAfterADayButValidOnesStay() {
        User owner = user("retention-tokens@overlab.test");
        UserToken expired = token(owner, "a".repeat(64), Instant.now().minus(Duration.ofDays(3)));
        UserToken justExpired = token(owner, "b".repeat(64), Instant.now().minus(Duration.ofHours(2)));
        UserToken valid = token(owner, "c".repeat(64), Instant.now().plus(Duration.ofDays(1)));

        tokenService.deleteExpired();
        entityManager.clear();

        assertThat(tokenRepository.findById(expired.getId())).isEmpty();
        assertThat(tokenRepository.findById(justExpired.getId())).isPresent();
        assertThat(tokenRepository.findById(valid.getId())).isPresent();
    }

    @Test
    void oldProcessedFeedbackIsDeletedButOpenAndRecentMessagesStay() {
        SiteFeedback oldResolved = feedback(FeedbackStatus.RESOLVED, Instant.now().minus(Duration.ofDays(400)));
        SiteFeedback oldOpen = feedback(FeedbackStatus.NEW, null);
        SiteFeedback recentResolved = feedback(FeedbackStatus.DISMISSED, Instant.now().minus(Duration.ofDays(2)));

        feedbackRetentionJob.deleteProcessedFeedback();
        entityManager.clear();

        assertThat(feedbackRepository.findById(oldResolved.getId())).isEmpty();
        assertThat(feedbackRepository.findById(oldOpen.getId())).isPresent();
        assertThat(feedbackRepository.findById(recentResolved.getId())).isPresent();
    }
}
