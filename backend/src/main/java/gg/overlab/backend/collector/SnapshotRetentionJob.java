package gg.overlab.backend.collector;

import gg.overlab.backend.stats.HeroStatRepository;
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.TemporalAdjusters;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class SnapshotRetentionJob {

    private static final Duration WINDOW = Duration.ofDays(7);

    private final HeroStatRepository heroStatRepository;
    private final CollectorProperties properties;

    @Scheduled(cron = "0 45 3 * * SUN")
    public int thinOutOldSnapshots() {
        Instant threshold = Instant.now().minus(Duration.ofDays(properties.retention().detailedDays()));
        int deleted = heroStatRepository.findOldestCaptureBefore(threshold)
                .map(oldest -> thinOut(weekStart(oldest), threshold))
                .orElse(0);
        if (deleted > 0) {
            log.info("Removed {} detailed snapshots older than {} days, kept the latest per week", deleted,
                    properties.retention().detailedDays());
        }
        return deleted;
    }

    private int thinOut(Instant firstWeekStart, Instant threshold) {
        int deleted = 0;
        for (Instant windowStart = firstWeekStart; windowStart.isBefore(threshold);
                windowStart = windowStart.plus(WINDOW)) {
            Instant windowEnd = windowStart.plus(WINDOW);
            deleted += heroStatRepository.deleteWindowKeepingLatest(windowStart,
                    windowEnd.isAfter(threshold) ? threshold : windowEnd);
        }
        return deleted;
    }

    private Instant weekStart(Instant moment) {
        return moment.atZone(ZoneOffset.UTC)
                .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
                .toLocalDate().atStartOfDay(ZoneOffset.UTC).toInstant();
    }
}
