package gg.overlab.backend.feedback;

import java.time.Duration;
import java.time.Instant;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
public class FeedbackRetentionJob {

    private final SiteFeedbackRepository repository;
    private final Duration retention;

    public FeedbackRetentionJob(SiteFeedbackRepository repository,
                                @Value("${app.feedback.retention:180d}") Duration retention) {
        this.repository = repository;
        this.retention = retention;
    }

    @Scheduled(cron = "0 40 3 * * *")
    @Transactional
    public void deleteProcessedFeedback() {
        int deleted = repository.deleteResolvedBefore(FeedbackStatus.NEW, Instant.now().minus(retention));
        if (deleted > 0) {
            log.info("Deleted {} processed feedback messages older than {}", deleted, retention);
        }
    }
}
