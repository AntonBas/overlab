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
}
