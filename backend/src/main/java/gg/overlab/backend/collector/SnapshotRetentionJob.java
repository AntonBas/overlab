package gg.overlab.backend.collector;

import gg.overlab.backend.stats.HeroStatRepository;
import java.time.Duration;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class SnapshotRetentionJob {

    private final HeroStatRepository heroStatRepository;
    private final CollectorProperties properties;

    @Scheduled(cron = "0 45 3 * * SUN")
    @Transactional
    public int thinOutOldSnapshots() {
        Instant threshold = Instant.now().minus(Duration.ofDays(properties.retention().detailedDays()));
        int deleted = heroStatRepository.deleteOlderKeepingWeeklyLatest(threshold);
        if (deleted > 0) {
            log.info("Removed {} detailed snapshots older than {} days, kept the latest per week", deleted,
                    properties.retention().detailedDays());
        }
        return deleted;
    }
}
